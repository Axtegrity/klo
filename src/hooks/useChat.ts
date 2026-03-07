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
// useChat Hook
// ------------------------------------------------------------

export function useChat() {
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AbortController ref so we can cancel in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);
      setIsLoading(true);

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
        let accumulated = "";

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
                const parsed = JSON.parse(data);
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
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
