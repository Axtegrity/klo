/* ------------------------------------------------------------------ */
/*  Claude (Anthropic Messages API) wrapper                            */
/* ------------------------------------------------------------------ */

import * as Sentry from "@sentry/nextjs";
import { getServiceSupabase } from "@/lib/supabase";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse {
  id: string;
  content: string;
  stopReason: string | null;
  usage: { inputTokens: number; outputTokens: number };
}

export interface ClaudeStreamCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/* ------------------------------------------------------------------ */
/*  Non-streaming request                                              */
/* ------------------------------------------------------------------ */

export async function sendAdvisorMessage(
  messages: Message[],
  systemPrompt?: string
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: 0.3,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Anthropic API error (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();

  return {
    id: data.id,
    content:
      data.content?.[0]?.type === "text" ? data.content[0].text : "",
    stopReason: data.stop_reason ?? null,
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Content Automation Pipeline — web-search-enabled research call     */
/*  + style-matched generation call                                    */
/*                                                                      */
/*  Both raw-fetch, no @anthropic-ai/sdk (matches the rest of this      */
/*  file). web_search is a server-side ("hosted") tool: Anthropic runs  */
/*  the search itself within the single Messages API call and returns  */
/*  server_tool_use / web_search_tool_result blocks interleaved with    */
/*  text blocks in the same response — there is no client-side tool    */
/*  loop to implement, unlike client-executed tools.                    */
/* ------------------------------------------------------------------ */

const CONTENT_AUTOMATION_MODEL = "claude-sonnet-5";
const WEB_SEARCH_TOOL_TYPE = "web_search_20260209";

// Anthropic content blocks vary by type (text, server_tool_use,
// web_search_tool_result, code_execution_tool_result, etc.). `content` is
// typed loosely (unknown) because its shape depends entirely on `type` —
// for `web_search_tool_result` it's an array of `web_search_result` items
// (see extractLaneSources() below); for other block types we don't inspect
// it further.
interface AnthropicContentBlock {
  type: string;
  text?: string;
  content?: unknown;
}

interface AnthropicMessagesResponse {
  id: string;
  content: AnthropicContentBlock[];
  stop_reason: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

async function callAnthropicMessages(
  body: Record<string, unknown>
): Promise<AnthropicMessagesResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as AnthropicMessagesResponse;
}

function extractText(content: AnthropicContentBlock[]): string {
  return content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n");
}

// Extracts the first balanced-brace JSON object embedded in `text` (models
// asked for "strict JSON" still sometimes wrap it in prose or a fenced code
// block — this tolerates both). Throws if no valid JSON object is found so
// the caller can treat the lane as failed rather than silently proceeding
// with garbage data.
function extractJsonObject<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model response");
  }
  const candidate = text.slice(start, end + 1);
  return JSON.parse(candidate) as T;
}

// Fresh, unvalidated starter list (Architect review, PR content-automation
// guidance-sources) — not final/sacred. Every domain that fails to match
// this list is logged (console.error + Sentry breadcrumb, see
// extractLaneSources()) specifically so it can be extended later from real
// observed data rather than guessed upfront.
export const REPUTABLE_TLD_SUFFIXES = [".gov", ".edu"] as const;
export const REPUTABLE_SOURCE_DOMAINS = [
  "reuters.com", "apnews.com", "bloomberg.com",
  "nytimes.com", "wsj.com", "washingtonpost.com", "economist.com",
  "forbes.com", "hbr.org",
  "techcrunch.com", "wired.com", "theverge.com", "arstechnica.com",
  "christianitytoday.com", "religionnews.com", "barna.com",
  "pewresearch.org", "gartner.com", "mckinsey.com",
] as const;

export interface LaneSource {
  url: string;
  domain: string;
  title?: string;
  reputable: boolean;
}

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isReputableDomain(domain: string): boolean {
  if (REPUTABLE_TLD_SUFFIXES.some((suffix) => domain.endsWith(suffix))) {
    return true;
  }
  return REPUTABLE_SOURCE_DOMAINS.some(
    (reputable) => domain === reputable || domain.endsWith(`.${reputable}`)
  );
}

// Parses `web_search_tool_result` blocks out of an Anthropic Messages
// response into a deduped (by domain), reputability-tagged source list.
//
// Verified shape (live test call this session, 2026-07-23, against
// claude-sonnet-5 + web_search_20260209): the hosted web_search tool on this
// model runs inside an internal `code_execution` sandbox — the response
// interleaves `server_tool_use` (code_execution + web_search),
// `code_execution_tool_result`/`bash_code_execution_tool_result`, and
// `web_search_tool_result` blocks all at the TOP LEVEL of `content[]` (never
// nested inside another block's own `content`). Each
// `web_search_tool_result.content` is an array of items shaped
// `{type: "web_search_result", title, url, encrypted_content, page_age}` —
// `encrypted_content` is an opaque, non-decryptable-client-side blob (we
// never use it); `title`/`url` are plain text and are all this function
// reads. Confirmed consistently across two independent live calls (5
// web_search_tool_result blocks total, one run truncated at max_tokens:
// 2048, one completed at max_tokens: 8192 — see searchLaneTopics() below for
// why max_tokens was raised).
function extractLaneSources(content: AnthropicContentBlock[]): LaneSource[] {
  const seenDomains = new Set<string>();
  const sources: LaneSource[] = [];

  for (const block of content) {
    if (block.type !== "web_search_tool_result" || !Array.isArray(block.content)) {
      continue;
    }

    for (const item of block.content as unknown[]) {
      if (
        !item ||
        typeof item !== "object" ||
        (item as { type?: unknown }).type !== "web_search_result"
      ) {
        continue;
      }

      const result = item as { url?: unknown; title?: unknown };
      if (typeof result.url !== "string" || !result.url) continue;

      const domain = getHostname(result.url);
      if (!domain || seenDomains.has(domain)) continue;
      seenDomains.add(domain);

      const reputable = isReputableDomain(domain);
      if (!reputable) {
        console.error(`[content-automation:sources] non-reputable domain discarded: ${domain}`);
        Sentry.addBreadcrumb({
          category: "content-automation",
          message: `Discarded non-reputable source domain: ${domain}`,
          level: "info",
        });
      }

      sources.push({
        url: result.url,
        domain,
        title: typeof result.title === "string" ? result.title : undefined,
        reputable,
      });
    }
  }

  return sources;
}

export interface LaneTopicResearch {
  primaryTopic: string;
  supportingTopics: string[];
  summary: string;
  sources: LaneSource[];
}

/**
 * Uses Anthropic's hosted web_search tool to find 2-3 current, vetted
 * topics (past 30 days) relevant to a content lane, and returns a
 * structured summary the generation call can draw from, plus the deduped
 * reputable/non-reputable source list extracted from the underlying search
 * results (see extractLaneSources()) — used by
 * runContentAutomationGenerate()'s reputable-source quality gate.
 */
export async function searchLaneTopics(
  laneName: string,
  laneDescription: string | null
): Promise<LaneTopicResearch> {
  const systemPrompt = `You are a research assistant for a faith-leadership content platform. Use web search to find 2-3 current, credible, and specific developments from the past 30 days relevant to the given topic lane. Prefer named events, publications, product launches, regulatory actions, or reports over generic trend commentary. When multiple comparable sources cover the same development, prefer wire services (Reuters, AP), national/major press, established trade press, and .gov/.edu sources over blogs, social media, or unvetted sites — this is a tiebreaker, not a requirement to skip the most relevant result. After researching, respond with ONLY a single JSON object (no prose before or after, no markdown fences) in this exact shape:
{"primaryTopic": "<the single most compelling, specific topic to write about>", "supportingTopics": ["<topic 2>", "<topic 3>"], "summary": "<3-6 sentences synthesizing what you found, with enough specifics (names, dates, sources) that a writer who did not do the search could write an informed, current article>"}`;

  const userPrompt = `Topic lane: ${laneName}${laneDescription ? `\nLane description: ${laneDescription}` : ""}\n\nFind 2-3 current, vetted topics from the past 30 days in this lane.`;

  // Trusted Sources: restrict the hosted web_search tool to admin-approved
  // domains when any are active. A fetch error here is treated the same as
  // "no trusted sources active" (fall back to unrestricted search) rather
  // than failing the whole lane — an outage in this optional allowlist
  // shouldn't take down generation, but it's surfaced to Sentry so a
  // persistent failure doesn't go unnoticed.
  let allowedDomains: string[] = [];
  try {
    const { data: trustedSources, error: trustedSourcesError } = await getServiceSupabase()
      .from("vault_trusted_sources")
      .select("domain")
      .eq("active", true);

    if (trustedSourcesError) throw trustedSourcesError;
    allowedDomains = (trustedSources ?? []).map((s) => s.domain as string);
  } catch (error) {
    console.error("[searchLaneTopics] failed to load trusted sources, proceeding without domain restriction", error);
    Sentry.captureException(error, { extra: { source: "search-lane-topics-trusted-sources" } });
  }

  const webSearchTool: Record<string, unknown> = {
    type: WEB_SEARCH_TOOL_TYPE,
    name: "web_search",
    max_uses: 5,
  };
  if (allowedDomains.length > 0) {
    webSearchTool.allowed_domains = allowedDomains;
  }

  const data = await callAnthropicMessages({
    model: CONTENT_AUTOMATION_MODEL,
    // 8192, not 2048: verified this session via a live test call that 2048
    // causes stop_reason: "max_tokens" before the model ever emits its final
    // JSON text block. claude-sonnet-5's hosted web_search tool runs an
    // internal agentic code_execution loop (multiple search queries +
    // retries on its own Python errors) whose thinking + tool-orchestration
    // tokens consume the budget well before the visible JSON answer. A
    // second live call at max_tokens: 8192 completed cleanly (stop_reason:
    // "end_turn") with a valid final JSON block. Without this, sources
    // (and primaryTopic/supportingTopics/summary) would rarely be reachable
    // in production — this fix is a direct prerequisite for the
    // reputable-source gate this function's `sources` field feeds.
    max_tokens: 8192,
    // No temperature/top_p/top_k: claude-sonnet-5 rejects any non-default
    // sampling parameter with a 400 (breaking change vs older models) —
    // steer determinism via the prompt instead.
    system: systemPrompt,
    tools: [webSearchTool],
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = extractText(data.content);
  const parsed = extractJsonObject<Omit<LaneTopicResearch, "sources">>(text);
  const sources = extractLaneSources(data.content);
  return { ...parsed, sources };
}

export interface VaultStyleReference {
  title: string;
  body: string;
}

export interface GeneratedVaultArticle {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
}

export interface GenerateVaultArticleOptions {
  // User-supplied focus for on-demand runs (Content Automation "Direction"
  // field). Undefined on the weekly cron path — no behavior change there.
  guidance?: string;
  // Extracted text from an admin-uploaded PDF/DOCX reference file (see
  // src/lib/document-extraction.ts). Undefined on the weekly cron path.
  referenceText?: string;
}

// Extracts the URLs cited inside the article body's closing `## Sources`
// section (markdown links: `- [Publication Name](URL)`). Used by
// validateCitedSources() below.
function extractCitedSourceUrls(body: string): string[] | null {
  const sectionMatch = body.match(/##\s*Sources\s*\n([\s\S]*)$/i);
  if (!sectionMatch) return null;

  const linkRegex = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(sectionMatch[1])) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

// Post-generation citation guard: verifies every URL the model actually
// cited in its `## Sources` section exactly matches a URL from the
// approved-sources set passed into the prompt. Throws (rather than
// silently accepting/stripping) so the caller's existing per-lane try/catch
// in runContentAutomationGenerate() treats this exactly like any other
// generation failure — no new failure path needed there.
//
// Beyond the literal "any URL not in the approved set" check, this also
// throws if the `## Sources` section is missing entirely or contains zero
// citations — the system prompt tells the model this section "MUST end
// with" a citation list when approved sources exist, so a model that
// skips it entirely is the exact hallucination-shaped failure this guard
// exists to catch, not a case to let through.
function validateCitedSources(body: string, approvedSources: LaneSource[]): void {
  const approvedUrls = new Set(approvedSources.map((s) => s.url));
  const citedUrls = extractCitedSourceUrls(body);

  if (citedUrls === null) {
    throw new Error("Generated article is missing the required '## Sources' section.");
  }
  if (citedUrls.length === 0) {
    throw new Error("Generated article's '## Sources' section contains no citations.");
  }

  const invalidUrls = citedUrls.filter((url) => !approvedUrls.has(url));
  if (invalidUrls.length > 0) {
    throw new Error(
      `Generated article cited unapproved source URL(s): ${invalidUrls.join(", ")}`
    );
  }
}

/**
 * Generates a new vault article in Keith L. Odom's voice, styled after
 * existing vault_content entries in the same category and informed by
 * fresh research from searchLaneTopics(). No web_search tool here — this
 * call is pure generation from provided context, constrained to a closed
 * list of pre-vetted reputable sources (see reputableSources / the
 * runContentAutomationGenerate() gate that filters research.sources down to
 * this list before this function is ever called).
 */
export async function generateVaultArticle(
  research: LaneTopicResearch,
  styleReferences: VaultStyleReference[],
  category: string,
  reputableSources: LaneSource[],
  options: GenerateVaultArticleOptions = {}
): Promise<GeneratedVaultArticle> {
  const baseSystemPrompt = `You are writing as Keith L. Odom — Technology Innovator, Speaker & Pastor. Write in his voice: connect technology to purpose and people through a faith-leadership lens. Match the tone, cadence, and structure of the style-reference articles provided (their length of sentence, use of subheadings, level of formality). The article must be 600-900 words and include a clearly-marked practical takeaway for faith leaders or executives near the end. Respond with ONLY a single JSON object (no prose before or after, no markdown fences) in this exact shape:
{"title": "<article title>", "slug": "<lowercase-hyphenated-slug, letters/numbers/hyphens only>", "excerpt": "<1-2 sentence summary, max 300 characters>", "body": "<full article body, 600-900 words, markdown formatting allowed>"}`;

  const approvedSourcesList = reputableSources
    .map((source) => `${source.title ?? source.domain}: ${source.url}`)
    .join("\n");

  const qualityGateBlock = `QUALITY REQUIREMENTS — these are non-negotiable:
1. Every factual claim must come from a source you found via web search in this session. Do not state facts from memory without verifying them first.
2. Only cite reputable sources: major news publications, academic institutions, government sites, established nonprofit or faith organizations, or peer-reviewed research. Do not cite blogs, social media, or unverified sites.
3. If you cannot find a reputable source for a claim, either remove the claim or explicitly label it as Keith's perspective with the phrase 'In my view,' or 'From a faith-leadership perspective,'
4. Approved sources (cite ONLY these — do not invent, alter, shorten, or add any other URL or publication name). Copy each URL character-for-character:
${approvedSourcesList}
5. The article body MUST end with a section starting with the exact heading \`## Sources\` (markdown H2, nothing else on that line), followed by one list item per source in the exact format \`- [Publication Name](URL)\` — one per line, no additional commentary in that section. Every URL must be copied exactly, character-for-character, from the approved list above.`;

  const systemPrompt = `${baseSystemPrompt}\n\n${qualityGateBlock}`;

  const styleBlock = styleReferences
    .map(
      (ref, i) =>
        `--- Style reference ${i + 1}: "${ref.title}" ---\n${ref.body}`
    )
    .join("\n\n");

  const guidanceBlock = options.guidance
    ? `\n\nThe user has requested this specific focus: ${options.guidance}. Research and write specifically around this angle within the lane's topic area.`
    : "";

  const referenceBlock = options.referenceText
    ? `\n\nAdditional reference material provided by the user (use as supporting context alongside the approved sources above — it does not replace the citation requirements):\n${options.referenceText}`
    : "";

  const userPrompt = `Category: ${category}

Primary topic to write about: ${research.primaryTopic}
Supporting context: ${research.supportingTopics.join("; ")}
Research summary: ${research.summary}

Style references from the existing vault (match tone and structure, do not copy content):
${styleBlock || "(no style references available — use Keith L. Odom's established faith-leadership voice)"}${guidanceBlock}${referenceBlock}`;

  const data = await callAnthropicMessages({
    model: CONTENT_AUTOMATION_MODEL,
    max_tokens: 4096,
    // No temperature/top_p/top_k: claude-sonnet-5 rejects any non-default
    // sampling parameter with a 400 (breaking change vs older models) —
    // steer variation via the prompt instead.
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = extractText(data.content);
  const article = extractJsonObject<GeneratedVaultArticle>(text);

  if (reputableSources.length > 0) {
    validateCitedSources(article.body, reputableSources);
  }

  return article;
}

/* ------------------------------------------------------------------ */
/*  Streaming request                                                  */
/* ------------------------------------------------------------------ */

export async function streamAdvisorMessage(
  messages: Message[],
  callbacks: ClaudeStreamCallbacks,
  systemPrompt?: string
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: 0.3,
    stream: true,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(
      `Anthropic API error (${response.status}): ${errorBody}`
    );
    callbacks.onError?.(error);
    throw error;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable.");
  }

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const event = JSON.parse(data);

          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta"
          ) {
            const token = event.delta.text;
            fullText += token;
            callbacks.onToken?.(token);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    callbacks.onComplete?.(fullText);
  } catch (error) {
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
