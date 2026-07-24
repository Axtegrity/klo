/* ------------------------------------------------------------------ */
/*  Claude (Anthropic Messages API) wrapper                            */
/* ------------------------------------------------------------------ */

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
// web_search_tool_result, etc.) — we only need the `text` blocks for
// both calls in this pipeline, so this stays a minimal shape rather than
// modeling every hosted-tool block variant.
interface AnthropicContentBlock {
  type: string;
  text?: string;
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

export interface LaneTopicResearch {
  primaryTopic: string;
  supportingTopics: string[];
  summary: string;
}

/**
 * Uses Anthropic's hosted web_search tool to find 2-3 current, vetted
 * topics (past 30 days) relevant to a content lane, and returns a
 * structured summary the generation call can draw from.
 */
export async function searchLaneTopics(
  laneName: string,
  laneDescription: string | null
): Promise<LaneTopicResearch> {
  const systemPrompt = `You are a research assistant for a faith-leadership content platform. Use web search to find 2-3 current, credible, and specific developments from the past 30 days relevant to the given topic lane. Prefer named events, publications, product launches, regulatory actions, or reports over generic trend commentary. After researching, respond with ONLY a single JSON object (no prose before or after, no markdown fences) in this exact shape:
{"primaryTopic": "<the single most compelling, specific topic to write about>", "supportingTopics": ["<topic 2>", "<topic 3>"], "summary": "<3-6 sentences synthesizing what you found, with enough specifics (names, dates, sources) that a writer who did not do the search could write an informed, current article>"}`;

  const userPrompt = `Topic lane: ${laneName}${laneDescription ? `\nLane description: ${laneDescription}` : ""}\n\nFind 2-3 current, vetted topics from the past 30 days in this lane.`;

  const data = await callAnthropicMessages({
    model: CONTENT_AUTOMATION_MODEL,
    max_tokens: 2048,
    temperature: 0.2,
    system: systemPrompt,
    tools: [{ type: WEB_SEARCH_TOOL_TYPE, name: "web_search", max_uses: 5 }],
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = extractText(data.content);
  return extractJsonObject<LaneTopicResearch>(text);
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

/**
 * Generates a new vault article in Keith L. Odom's voice, styled after
 * existing vault_content entries in the same category and informed by
 * fresh research from searchLaneTopics(). No web_search tool here — this
 * call is pure generation from provided context.
 */
export async function generateVaultArticle(
  research: LaneTopicResearch,
  styleReferences: VaultStyleReference[],
  category: string
): Promise<GeneratedVaultArticle> {
  const systemPrompt = `You are writing as Keith L. Odom — Technology Innovator, Speaker & Pastor. Write in his voice: connect technology to purpose and people through a faith-leadership lens. Match the tone, cadence, and structure of the style-reference articles provided (their length of sentence, use of subheadings, level of formality). The article must be 600-900 words and include a clearly-marked practical takeaway for faith leaders or executives near the end. Respond with ONLY a single JSON object (no prose before or after, no markdown fences) in this exact shape:
{"title": "<article title>", "slug": "<lowercase-hyphenated-slug, letters/numbers/hyphens only>", "excerpt": "<1-2 sentence summary, max 300 characters>", "body": "<full article body, 600-900 words, markdown formatting allowed>"}`;

  const styleBlock = styleReferences
    .map(
      (ref, i) =>
        `--- Style reference ${i + 1}: "${ref.title}" ---\n${ref.body}`
    )
    .join("\n\n");

  const userPrompt = `Category: ${category}

Primary topic to write about: ${research.primaryTopic}
Supporting context: ${research.supportingTopics.join("; ")}
Research summary: ${research.summary}

Style references from the existing vault (match tone and structure, do not copy content):
${styleBlock || "(no style references available — use Keith L. Odom's established faith-leadership voice)"}`;

  const data = await callAnthropicMessages({
    model: CONTENT_AUTOMATION_MODEL,
    max_tokens: 4096,
    temperature: 0.5,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = extractText(data.content);
  return extractJsonObject<GeneratedVaultArticle>(text);
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
