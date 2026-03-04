"use client";

import { useMemo } from "react";
import { Cloud } from "lucide-react";
import Card from "@/components/shared/Card";
import { WORD_CLOUD_PALETTE, WORD_CLOUD_MIN_FONT, WORD_CLOUD_MAX_FONT } from "../constants";
import type { WordCloudEntry } from "../types";

interface WordCloudCanvasProps {
  entries: WordCloudEntry[];
  loading: boolean;
  width?: number;
  height?: number;
}

interface PlacedWord {
  word: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotate: number;
}

function layoutWords(
  entries: WordCloudEntry[],
  width: number,
  height: number
): PlacedWord[] {
  if (entries.length === 0) return [];

  const maxCount = Math.max(...entries.map((e) => e.count));
  const minCount = Math.min(...entries.map((e) => e.count));
  const range = maxCount - minCount || 1;

  const placed: PlacedWord[] = [];
  const cx = width / 2;
  const cy = height / 2;

  // Spiral placement
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const t = (entry.count - minCount) / range;
    const fontSize = WORD_CLOUD_MIN_FONT + t * (WORD_CLOUD_MAX_FONT - WORD_CLOUD_MIN_FONT);
    const color = WORD_CLOUD_PALETTE[i % WORD_CLOUD_PALETTE.length];
    const rotate = i % 5 === 0 ? -15 + Math.random() * 30 : 0;

    // Spiral outward from center
    let angle = i * 0.7;
    let radius = 0;
    let x = cx;
    let y = cy;

    for (let step = 0; step < 200; step++) {
      x = cx + radius * Math.cos(angle);
      y = cy + radius * Math.sin(angle);

      // Simple bounds check
      const wordWidth = entry.word.length * fontSize * 0.55;
      if (
        x - wordWidth / 2 > 10 &&
        x + wordWidth / 2 < width - 10 &&
        y - fontSize / 2 > 10 &&
        y + fontSize / 2 < height - 10
      ) {
        break;
      }

      angle += 0.3;
      radius += 2;
    }

    placed.push({ word: entry.word, x, y, fontSize, color, rotate });
  }

  return placed;
}

export default function WordCloudCanvas({
  entries,
  loading,
  width = 600,
  height = 350,
}: WordCloudCanvasProps) {
  const placedWords = useMemo(() => layoutWords(entries, width, height), [entries, width, height]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="w-12 h-12 rounded-xl bg-[#2764FF]/10 flex items-center justify-center mx-auto mb-3">
          <Cloud size={24} className="text-[#2764FF]" />
        </div>
        <p className="text-klo-muted text-sm">
          No words submitted yet. Add your word to the cloud!
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: "400px" }}
      >
        {placedWords.map((w, i) => (
          <text
            key={`${w.word}-${i}`}
            x={w.x}
            y={w.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={w.color}
            fontSize={w.fontSize}
            fontFamily="DM Sans, sans-serif"
            fontWeight={w.fontSize > 40 ? "bold" : "normal"}
            transform={w.rotate ? `rotate(${w.rotate} ${w.x} ${w.y})` : undefined}
            style={{ transition: "all 0.5s ease" }}
          >
            {w.word}
          </text>
        ))}
      </svg>
    </Card>
  );
}
