import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AI_ADVISOR_SYSTEM_PROMPT } from "@/lib/constants";
import { advisorLimiter, checkLimit, getClientIp } from "@/lib/ratelimit";
import { aiAdvisorSchema } from "@/lib/validation";
import { logError, logRequest } from "@/lib/logger";
import { getServiceSupabase } from "@/lib/supabase";

const STOPWORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "is","are","was","were","be","been","being","have","has","had","do","does",
  "did","will","would","could","should","may","might","shall","i","you","he",
  "she","it","we","they","me","him","her","us","them","my","your","his","its",
  "our","their","that","this","these","those","what","how","why","when","where",
  "which","who","not","no","so","if","as","by","from","up","about","into","than",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase().split(/\W+/).filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}

async function buildRagContext(lastUserMessage: string): Promise<string> {
  try {
    const supabase = getServiceSupabase();
    const { data: docs } = await supabase
      .from("vault_content")
      .select("id,title,excerpt,body,category")
      .eq("visibility", "public")
      .limit(60);

    if (!docs || docs.length === 0) return "";

    const queryTokens = tokenize(lastUserMessage);
    if (queryTokens.size === 0) return "";

    const scored = docs.map((doc) => {
      const docText = `${doc.title ?? ""} ${doc.excerpt ?? ""} ${(doc.body ?? "").slice(0, 800)}`;
      const docTokens = tokenize(docText);
      let overlap = 0;
      queryTokens.forEach((t) => { if (docTokens.has(t)) overlap++; });
      return { doc, score: overlap };
    });

    const top3 = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (top3.length === 0) return "";

    const blocks = top3.map(({ doc }) => {
      const snippet = (doc.excerpt ?? doc.body ?? "").slice(0, 400);
      return `[${doc.category ?? "Article"}] ${doc.title}\n${snippet}`;
    });

    return `\n\nRelevant context from Keith's vault:\n\n${blocks.join("\n\n---\n\n")}`;
  } catch {
    return "";
  }
}

// ------------------------------------------------------------
// POST /api/ai-advisor
// ------------------------------------------------------------

export async function POST(request: NextRequest) {
  logRequest(request);
  try {
    // Auth required — prevents unauthenticated API abuse
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI Advisor is not configured. Missing API key." },
        { status: 503 }
      );
    }

    // Rate limiting (Upstash-backed, falls back to allow-all if not configured)
    const ip = getClientIp(request);
    const { allowed, remaining } = await checkLimit(advisorLimiter, ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = aiAdvisorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }
    const messages = parsed.data.messages;

    // Build RAG context from vault — use the last user message for retrieval
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const ragContext = await buildRagContext(lastUserMsg);
    const systemPrompt = ragContext
      ? `${AI_ADVISOR_SYSTEM_PROMPT}${ragContext}`
      : AI_ADVISOR_SYSTEM_PROMPT;

    // Call Anthropic Messages API with streaming
    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          temperature: 0.3,
          system: systemPrompt,
          stream: true,
          messages: messages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      logError(new Error(errorText), { endpoint: '/api/ai-advisor', status: anthropicResponse.status });
      return NextResponse.json(
        { error: "AI service is temporarily unavailable." },
        { status: 502 }
      );
    }

    // Stream SSE back to client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            // Keep the last potentially incomplete line in the buffer
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const event = JSON.parse(data);

                  if (
                    event.type === "content_block_delta" &&
                    event.delta?.type === "text_delta"
                  ) {
                    const text = event.delta.text;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                    );
                  }

                  if (event.type === "message_stop") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  }
                } catch {
                  // Skip non-JSON lines (event type lines, etc.)
                }
              }
            }
          }
        } catch (err) {
          logError(err, { endpoint: '/api/ai-advisor', context: 'stream' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (err) {
    logError(err, { endpoint: '/api/ai-advisor' });
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
