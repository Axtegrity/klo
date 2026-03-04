"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import Card from "@/components/shared/Card";

interface QuestionInputProps {
  onSubmit: (text: string, authorName?: string) => Promise<boolean>;
}

export default function QuestionInput({ onSubmit }: QuestionInputProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    const ok = await onSubmit(trimmed);
    if (ok) setText("");
    setSubmitting(false);
  };

  return (
    <Card>
      <div className="flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ask an anonymous question..."
          className="flex-1 bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50 focus:ring-1 focus:ring-[#2764FF]/20 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {submitting ? "Sending..." : "Submit"}
        </button>
      </div>
    </Card>
  );
}
