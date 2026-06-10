"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@/components/shared/Card";

interface AccordionItemProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function AccordionItem({ title, icon: Icon, children }: AccordionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="inline-flex items-center gap-3 text-sm font-semibold text-klo-text">
          <Icon size={16} className="text-[#2764FF]" />
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-klo-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-klo-muted leading-relaxed space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InstructionsSection() {
  return (
    <Card>
      <h3 className="text-base font-semibold text-klo-text mb-2">How It Works</h3>
      <AccordionItem title="For Attendees" icon={Users}>
        <p>1. Switch between Polls, Q&amp;A, and Word Cloud using the tabs above.</p>
        <p>2. Vote on active polls — each person gets one vote per poll.</p>
        <p>3. Submit anonymous questions and upvote others you want answered.</p>
        <p>4. Add words to the live word cloud to express key themes.</p>
        <p>5. Popular questions rise to the top automatically.</p>
      </AccordionItem>
    </Card>
  );
}
