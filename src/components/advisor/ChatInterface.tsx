"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bot, Send, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AdvisorMessage } from "@/types";

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

interface ChatInterfaceProps {
  messages: AdvisorMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (content: string) => void;
  disabled?: boolean;
}

// ------------------------------------------------------------
// Animation variants
// ------------------------------------------------------------

const messageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ------------------------------------------------------------
// Typing Indicator
// ------------------------------------------------------------

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 px-4 py-3"
    >
      <div className="w-8 h-8 rounded-full bg-[#2764FF]/10 flex items-center justify-center shrink-0">
        <Bot size={16} className="text-[#2764FF]" />
      </div>
      <div className="flex items-center gap-1 px-3 py-2 bg-[#161B22] rounded-xl">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-[#2764FF]/60"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------
// Single Message Bubble
// ------------------------------------------------------------

function MessageBubble({ message }: { message: AdvisorMessage }) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-[#2764FF]/20" : "bg-[#2764FF]/10"
        }`}
      >
        {isUser ? (
          <User size={16} className="text-[#2764FF]" />
        ) : (
          <Bot size={16} className="text-[#2764FF]" />
        )}
      </div>

      {/* Content */}
      <div
        className={`max-w-[80%] md:max-w-[70%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-[#2764FF]/10 border border-[#2764FF]/20 text-klo-text"
              : "bg-[#161B22] text-klo-text"
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-klo-text prose-headings:text-klo-text prose-headings:font-display prose-strong:text-klo-text prose-a:text-[#2764FF] prose-code:text-[#2764FF]/80 prose-code:bg-[#161B22] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#161B22] prose-pre:border prose-pre:border-[#21262D] prose-li:marker:text-[#2764FF]/60">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || "\u00A0"}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span
          className={`text-[10px] text-klo-muted mt-1 block ${
            isUser ? "text-right" : "text-left"
          } px-1`}
        >
          {time}
        </span>
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------
// Chat Interface
// ------------------------------------------------------------

export default function ChatInterface({
  messages,
  isLoading,
  error,
  onSend,
  disabled = false,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Smooth auto-scroll using an anchor element at the bottom of the list.
  // Deriving a lightweight dependency from the last message's content length
  // so we re-scroll on every streaming chunk without deep-comparing the array.
  const lastMsg = messages[messages.length - 1];
  const scrollKey = lastMsg ? `${lastMsg.id}-${lastMsg.content.length}` : "";

  const scrollToBottom = useCallback(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollKey, isLoading, scrollToBottom]);

  // Auto-resize textarea
  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!textareaRef.current) return;

    const content = textareaRef.current.value.trim();
    if (!content || isLoading || disabled) return;

    onSend(content);
    textareaRef.current.value = "";
    textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      form?.requestSubmit();
    }
  };

  const showTypingIndicator =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1]?.content === "";

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
      >
        <AnimatePresence mode="popLayout">
          {messages
            .filter((m) => m.role !== "system")
            .map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
        </AnimatePresence>

        <AnimatePresence>
          {showTypingIndicator && <TypingIndicator />}
        </AnimatePresence>

        {/* Invisible anchor to smooth-scroll to */}
        <div ref={scrollAnchorRef} aria-hidden="true" />
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4"
          >
            <div className="flex items-center gap-2 px-4 py-2 mb-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="px-4 pb-4 pt-2 border-t border-klo-slate"
      >
        <div className="flex items-end gap-2 bg-[#161B22] border border-[#21262D] rounded-xl px-3 py-2 focus-within:border-[#2764FF]/40 transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              disabled
                ? "Usage limit reached"
                : "Ask the KLO AI Advisor..."
            }
            disabled={isLoading || disabled}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-klo-text placeholder:text-klo-muted resize-none outline-none max-h-40 py-1.5 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || disabled}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white hover:brightness-110 active:brightness-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
