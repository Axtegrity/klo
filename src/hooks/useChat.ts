"use client";

import { useState, useCallback, useRef } from "react";
import type { AdvisorMessage } from "@/types";

// ------------------------------------------------------------
// Unique ID generator
// ------------------------------------------------------------

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ------------------------------------------------------------
// DB persistence helpers — fire-and-forget, never block UX
// ------------------------------------------------------------

async function persistNewConversation(
  title: string,
  messages: AdvisorMessage[]
): Promise<string | null> {
  try {
    const res = await fetch("/api/advisor/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, messages }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
  } catch {
    return null;
  }
}

async function appendToConversation(
  conversationId: string,
  messages: AdvisorMessage[]
): Promise<void> {
  try {
    await fetch(`/api/advisor/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch {
    // swallow — DB errors must never affect the chat UX
  }
}

// ------------------------------------------------------------
// useChat Hook
// ------------------------------------------------------------

export function useChat() {
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // AbortController ref so we can cancel in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);
      setIsLoading(true);

      // Capture whether this is the first message BEFORE state updates
      const isFirstMessage = messages.length === 0;

      // Add user message
      const userMessage: AdvisorMessage = {
        id: uid(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      const assistantMessage: AdvisorMessage = {
        id: uid(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Build API payload (only user/assistant messages)
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Track stream success and final content for DB persistence
      let streamSucceeded = false;
      let accumulated = "";

      try {
        abortRef.current = new AbortController();

        const response = await fetch("/api/ai-advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => null);
          throw new Error(
            errBody?.error ?? `Request failed (${response.status})`
          );
        }

        // Read SSE stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream available.");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data) as { text?: string };
                if (parsed.text) {
                  accumulated += parsed.text;
                  const snapshot = accumulated;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, content: snapshot }
                        : m
                    )
                  );
                }
              } catch {
                // skip malformed SSE chunks
              }
            }
          }
        }

        streamSucceeded = true;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User cancelled — not an error
          return;
        }
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);

        // Remove the empty assistant message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantMessage.id)
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }

      // Fire-and-forget DB persistence — runs after stream, never blocks UX.
      // Only runs on success; aborted/errored streams are not persisted.
      if (streamSucceeded && accumulated.length > 0) {
        const completedAssistantMessage: AdvisorMessage = {
          ...assistantMessage,
          content: accumulated,
        };
        const messagePair: AdvisorMessage[] = [
          userMessage,
          completedAssistantMessage,
        ];

        if (isFirstMessage) {
          // Create a new conversation row — title is first 60 chars of user message
          const title = userMessage.content.slice(0, 60);
          persistNewConversation(title, messagePair).then((id) => {
            if (id) setConversationId(id);
          });
        } else {
          // Append the new message pair to the existing conversation
          setConversationId((currentId) => {
            if (currentId) {
              appendToConversation(currentId, messagePair);
            }
            return currentId;
          });
        }
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setConversationId(null);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/advisor/conversations/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        conversation?: { messages: AdvisorMessage[]; id: string };
      };
      if (!data.conversation) return;
      setMessages(data.conversation.messages);
      setConversationId(data.conversation.id);
      setError(null);
    } catch {
      // swallow — never surface to user
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    clearChat,
    loadConversation,
  };
}
