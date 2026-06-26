"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "@/features/conference/hooks/useConferenceRealtime";
import LiveSessionEntry from "@/features/conference/components/LiveSessionEntry";

interface Session {
  id: string;
  title: string;
  speaker: string | null;
  time_label: string | null;
  room: string | null;
  is_active: boolean;
}

interface LiveData {
  event: {
    id: string;
    title: string;
    slug: string;
    conference_name: string;
    conference_location: string;
    event_date: string;
    rehearsal_mode: boolean;
    requires_code: boolean;
    access_code: string | null;
  };
  sessions: Session[];
}

export default function JoinPage() {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLive = useCallback(() => {
    fetch("/api/conference/live")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        setLiveData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);

  useConferenceRealtime({ onSettingsChange: fetchLive });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="w-8 h-8 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!liveData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#0D1117" }}>
        <div className="w-16 h-16 rounded-2xl bg-[#2764FF]/10 flex items-center justify-center">
          <span className="text-3xl">📡</span>
        </div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          No live session right now
        </h1>
        <p className="text-sm text-[#8B949E] max-w-xs">
          Check back when Keith goes live. This page will update automatically.
        </p>
        <a href="/" className="text-sm text-[#2764FF] hover:underline mt-2">
          Browse Keith's site →
        </a>
      </div>
    );
  }

  return <LiveSessionEntry event={liveData.event} sessions={liveData.sessions} />;
}
