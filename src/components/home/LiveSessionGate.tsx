"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConferenceRealtime } from "@/features/conference/hooks/useConferenceRealtime";

interface LiveData {
  event: {
    id: string;
    conference_name: string;
    rehearsal_mode: boolean;
    requires_code: boolean;
  };
  sessions: { id: string }[];
}

export default function LiveSessionGate() {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const router = useRouter();

  const fetchLive = useCallback(() => {
    fetch("/api/conference/live")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setLiveData(data))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);
  useConferenceRealtime({ onSettingsChange: fetchLive });

  if (!liveData) return null;
  if (liveData.event.rehearsal_mode) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: "#0D1117" }}
    >
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(16,185,129,0.1)", border: "0.5px solid rgba(16,185,129,0.3)" }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-emerald-400 tracking-wide">Live now</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {liveData.event.conference_name}
          </h1>
          <p className="text-sm text-[#8B949E]">Keith is presenting right now</p>
        </div>

        <button
          onClick={() => router.push("/join")}
          className="w-full py-5 rounded-2xl text-lg font-bold transition-all"
          style={{ background: "#34d399", color: "#052e16" }}
        >
          Join session
        </button>

        <button
          onClick={() => setLiveData(null)}
          className="text-xs text-[#8B949E] hover:text-white transition-colors"
        >
          Browse site instead →
        </button>
      </div>
    </div>
  );
}
