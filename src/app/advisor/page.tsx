"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Bot, Trash2, FileText } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import ChatInterface from "@/components/advisor/ChatInterface";
import SuggestedPrompts from "@/components/advisor/SuggestedPrompts";
import UsageMeter from "@/components/advisor/UsageMeter";

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
    usageCount,
    usageLimit,
  } = useChat();

  const hasMessages = messages.length > 0;
  const atLimit = usageCount >= usageLimit;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
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
              className="w-10 h-10 rounded-xl bg-klo-gold/10 flex items-center justify-center"
            >
              <Bot size={22} className="text-klo-gold" />
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
                className="text-xs text-klo-muted"
              >
                AI Strategic Advisor
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.div variants={fadeUp} custom={3}>
              <Link
                href="/advisor/policy-builder"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-klo-gold/10 text-klo-gold border border-klo-gold/20 hover:bg-klo-gold/20 transition-colors"
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
          className="max-w-3xl mx-auto text-[11px] text-klo-muted mt-2 leading-snug"
        >
          AI-generated guidance based on Keith L. Odom&apos;s frameworks. Not
          professional advice.
        </motion.p>
      </motion.header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full min-h-0">
        {!hasMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <SuggestedPrompts onSelect={sendMessage} />
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              error={error}
              onSend={sendMessage}
              disabled={atLimit}
            />
          </div>
        )}

        {/* Usage meter shown below chat when there are messages, or below prompts */}
        {hasMessages && (
          <UsageMeter usageCount={usageCount} usageLimit={usageLimit} />
        )}
      </div>
    </div>
  );
}
