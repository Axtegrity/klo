"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import type { WordCloudEntry } from "../types";

export default function WordCloudManager() {
  const [entries, setEntries] = useState<WordCloudEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/word-cloud");
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const clearAll = async () => {
    if (!confirm("Clear all word cloud entries? This cannot be undone.")) return;
    setClearing(true);
    try {
      const res = await fetch("/api/conference/word-cloud/clear", { method: "DELETE" });
      if (res.ok) {
        setEntries([]);
      }
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  const totalSubmissions = entries.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-klo-muted">
          {entries.length} unique words, {totalSubmissions} total submissions
        </p>
        <button
          onClick={clearAll}
          disabled={clearing || entries.length === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
        >
          <Trash2 size={14} />
          {clearing ? "Clearing..." : "Clear All"}
        </button>
      </div>

      {entries.length > 0 ? (
        <div className="glass rounded-2xl p-4 border border-white/5">
          <div className="flex flex-wrap gap-2">
            {entries.slice(0, 50).map((entry) => (
              <span
                key={entry.word}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm"
              >
                <span className="text-klo-text">{entry.word}</span>
                <span className="text-xs text-klo-muted">({entry.count})</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-klo-muted text-center py-4">No word cloud entries yet</p>
      )}
    </div>
  );
}
