"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  ShieldCheck,
  ShieldAlert,
  Workflow,
  Church,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ------------------------------------------------------------
// Prompt data
// ------------------------------------------------------------

interface SuggestedPrompt {
  text: string;
  icon: LucideIcon;
}

const PROMPTS: SuggestedPrompt[] = [
  {
    text: "Build an AI policy for a church",
    icon: Church,
  },
  {
    text: "Evaluate our digital readiness",
    icon: ShieldCheck,
  },
  {
    text: "What are the risks of AI in business?",
    icon: ShieldAlert,
  },
  {
    text: "What are the key components of a digital transformation strategy?",
    icon: Workflow,
  },
  {
    text: "How can we use technology to improve ministry engagement?",
    icon: BrainCircuit,
  },
  {
    text: "What should our AI ethics policy include?",
    icon: ScrollText,
  },
];

// ------------------------------------------------------------
// Animation
// ------------------------------------------------------------

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

interface SuggestedPromptsProps {
  onSelect: (text: string) => void;
}

export default function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="px-4 py-6">
      <p className="text-sm text-klo-muted mb-4 text-center">
        Get started with a question
      </p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto"
      >
        {PROMPTS.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <motion.button
              key={prompt.text}
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(prompt.text)}
              className="flex items-start gap-3 text-left bg-[#161B22] border border-[#21262D] rounded-xl px-4 py-3 hover:border-[#2764FF]/40 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2764FF]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#2764FF]/20 transition-colors">
                <Icon size={16} className="text-[#2764FF]" />
              </div>
              <span className="text-sm text-klo-text leading-snug">
                {prompt.text}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
