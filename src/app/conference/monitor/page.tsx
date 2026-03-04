"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, MessageSquare, Cloud } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { usePolls } from "@/features/conference/hooks/usePolls";
import { useQuestions } from "@/features/conference/hooks/useQuestions";
import { useWordCloud } from "@/features/conference/hooks/useWordCloud";
import {
  CONFERENCE_COLORS,
  WORD_CLOUD_PALETTE,
  MONITOR_CYCLE_INTERVAL,
  WORD_CLOUD_MIN_FONT,
  WORD_CLOUD_MAX_FONT,
} from "@/features/conference/constants";
import type { WordCloudEntry } from "@/features/conference/types";

const BAR_COLORS = [
  CONFERENCE_COLORS.blue,
  CONFERENCE_COLORS.cyan,
  CONFERENCE_COLORS.gold,
  CONFERENCE_COLORS.purple,
  CONFERENCE_COLORS.lime,
  CONFERENCE_COLORS.magenta,
];

type MonitorView = "polls" | "questions" | "wordcloud";

function MonitorWordCloud({ entries }: { entries: WordCloudEntry[] }) {
  if (entries.length === 0) {
    return (
      <p style={{ color: "#8B949E", textAlign: "center", fontSize: 24 }}>
        No words submitted yet
      </p>
    );
  }

  const maxCount = Math.max(...entries.map((e) => e.count));
  const minCount = Math.min(...entries.map((e) => e.count));
  const range = maxCount - minCount || 1;
  const width = 1200;
  const height = 600;
  const cx = width / 2;
  const cy = height / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "70vh" }}>
      {entries.slice(0, 40).map((entry, i) => {
        const t = (entry.count - minCount) / range;
        const fontSize = WORD_CLOUD_MIN_FONT * 1.5 + t * (WORD_CLOUD_MAX_FONT * 1.5 - WORD_CLOUD_MIN_FONT * 1.5);
        const angle = i * 0.7;
        const radius = i * 15;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);

        return (
          <text
            key={`${entry.word}-${i}`}
            x={Math.max(100, Math.min(x, width - 100))}
            y={Math.max(50, Math.min(y, height - 50))}
            textAnchor="middle"
            dominantBaseline="central"
            fill={WORD_CLOUD_PALETTE[i % WORD_CLOUD_PALETTE.length]}
            fontSize={fontSize}
            fontFamily="DM Sans, sans-serif"
            fontWeight={fontSize > 60 ? "bold" : "normal"}
          >
            {entry.word}
          </text>
        );
      })}
    </svg>
  );
}

export default function MonitorPage() {
  const [view, setView] = useState<MonitorView>("polls");
  const { activePolls } = usePolls();
  const { questions } = useQuestions();
  const { entries } = useWordCloud();

  // Auto-cycle views
  useEffect(() => {
    const views: MonitorView[] = ["polls", "questions", "wordcloud"];
    const interval = setInterval(() => {
      setView((prev) => {
        const idx = views.indexOf(prev);
        return views[(idx + 1) % views.length];
      });
    }, MONITOR_CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Escape key exits
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const topQuestions = [...questions]
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 5);

  const activePoll = activePolls[0];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0D1117",
        display: "flex",
        flexDirection: "column",
        padding: "40px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* KLO watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 30,
          fontSize: 14,
          color: "#8B949E",
          opacity: 0.5,
        }}
      >
        KLO Conference
      </div>

      {/* View indicator */}
      <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
        {(["polls", "questions", "wordcloud"] as MonitorView[]).map((v) => {
          const Icon = v === "polls" ? BarChart3 : v === "questions" ? MessageSquare : Cloud;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                background: view === v ? "#21262D" : "transparent",
                color: view === v ? "#E6EDF3" : "#8B949E",
              }}
            >
              <Icon size={18} />
              {v === "polls" ? "Polls" : v === "questions" ? "Q&A" : "Word Cloud"}
            </button>
          );
        })}
      </div>

      {/* Poll results */}
      {view === "polls" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {activePoll ? (
            <>
              <h2
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#E6EDF3",
                  marginBottom: 40,
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {activePoll.question}
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={(activePoll.options as string[]).map((option, idx) => ({
                    name: option,
                    votes: activePoll.votes[idx] || 0,
                  }))}
                  layout="vertical"
                >
                  <XAxis type="number" stroke="#8B949E" tick={{ fontSize: 18 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#8B949E"
                    tick={{ fontSize: 18 }}
                    width={250}
                  />
                  <Bar dataKey="votes" radius={[0, 8, 8, 0]} barSize={40}>
                    {(activePoll.options as string[]).map((_, idx) => (
                      <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p style={{ fontSize: 24, color: "#8B949E", textAlign: "center" }}>
              No active polls
            </p>
          )}
        </div>
      )}

      {/* Top questions */}
      {view === "questions" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#E6EDF3",
              marginBottom: 40,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Top Questions
          </h2>
          {topQuestions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topQuestions.map((q, i) => (
                <div
                  key={q.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    padding: "20px 24px",
                    borderRadius: 16,
                    background: "#161B22",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      minWidth: 50,
                      textAlign: "center",
                      fontSize: 24,
                      fontWeight: 700,
                      color: CONFERENCE_COLORS.gold,
                    }}
                  >
                    {q.upvotes}
                  </div>
                  <p style={{ fontSize: 20, color: "#E6EDF3", margin: 0 }}>{q.text}</p>
                  {q.is_answered && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 14,
                        color: "#6ECF55",
                        fontWeight: 600,
                      }}
                    >
                      Answered
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 24, color: "#8B949E", textAlign: "center" }}>
              No questions yet
            </p>
          )}
        </div>
      )}

      {/* Word cloud */}
      {view === "wordcloud" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#E6EDF3",
              marginBottom: 20,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Word Cloud
          </h2>
          <MonitorWordCloud entries={entries} />
        </div>
      )}
    </div>
  );
}
