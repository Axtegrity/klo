"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Bot, Trash2, FileText, Send } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import ChatInterface from "@/components/advisor/ChatInterface";
import SuggestedPrompts from "@/components/advisor/SuggestedPrompts";
import { haptics } from "@/lib/haptics";

// ------------------------------------------------------------
// Animation variants
// ------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

// ------------------------------------------------------------
// Page Component
// ------------------------------------------------------------

export default function AdvisorPage() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  } = useChat();

  const hasMessages = messages.length > 0;
  const initialInputRef = useRef<HTMLTextAreaElement>(null);

  const handleInitialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!initialInputRef.current) return;
    const content = initialInputRef.current.value.trim();
    if (!content || isLoading) return;
    haptics.light();
    sendMessage(content);
  };

  const handleInitialKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      form?.requestSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <motion.header
        initial="hidden"
        animate="visible"
        className="shrink-0 px-4 pt-6 pb-4 border-b border-klo-slate"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              variants={fadeUp}
              custom={0}
              className="w-10 h-10 rounded-xl bg-[#2764FF]/10 flex items-center justify-center"
            >
              <Bot size={22} className="text-[#2764FF]" />
            </motion.div>
            <div>
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-display text-xl font-bold text-klo-text leading-tight"
              >
                Ask Keith
              </motion.h1>
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-xs text-[#8B949E]"
              >
                AI Strategic Advisor
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.div variants={fadeUp} custom={3}>
              <Link
                href="/advisor/policy-builder"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2764FF]/10 text-[#2764FF] border border-[#2764FF]/20 hover:bg-[#2764FF]/20 transition-colors"
              >
                <FileText size={13} />
                AI Policy Builder
              </Link>
            </motion.div>

            {hasMessages && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={clearChat}
                title="Clear conversation"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <motion.p
          variants={fadeUp}
          custom={3}
          className="max-w-3xl mx-auto text-[11px] text-[#8B949E] mt-2 leading-snug"
        >
          AI-generated guidance based on Keith L. Odom&apos;s frameworks. Not
          professional advice.
        </motion.p>
      </motion.header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full min-h-0">
        {!hasMessages ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <SuggestedPrompts onSelect={sendMessage} />
            </div>

            {/* Direct text input */}
            <form
              onSubmit={handleInitialSubmit}
              className="px-4 pb-4 pt-2 border-t border-klo-slate"
            >
              <div className="flex items-end gap-2 bg-[#161B22] border border-[#21262D] rounded-xl px-3 py-2 focus-within:border-[#2764FF]/40 transition-colors">
                <textarea
                  ref={initialInputRef}
                  rows={1}
                  placeholder="Type your own question..."
                  disabled={isLoading}
                  onKeyDown={handleInitialKeyDown}
                  onChange={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                  }}
                  className="flex-1 bg-transparent text-sm text-klo-text placeholder:text-klo-muted resize-none outline-none max-h-40 py-1.5 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-label="Send message"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white hover:brightness-110 active:brightness-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 min-h-0" aria-live="polite">
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              error={error}
              onSend={sendMessage}
            />
          </div>
        )}

      </div>
    </div>
  );
}
