"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Card from "@/components/shared/Card";

interface WordCloudInputProps {
  onSubmit: (word: string) => Promise<boolean>;
}

export default function WordCloudInput({ onSubmit }: WordCloudInputProps) {
  const [word, setWord] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = word.trim();
    if (!trimmed) return;
    setSubmitting(true);
    const ok = await onSubmit(trimmed);
    if (ok) setWord("");
    setSubmitting(false);
  };

  return (
    <Card>
      <div className="flex gap-3">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Add a word to the cloud (max 30 chars)..."
          maxLength={30}
          className="flex-1 bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50 focus:ring-1 focus:ring-[#2764FF]/20 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!word.trim() || submitting}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {submitting ? "Adding..." : "Add"}
        </button>
      </div>
    </Card>
  );
}
