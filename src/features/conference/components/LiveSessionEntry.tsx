"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Session {
  id: string;
  title: string;
  speaker: string | null;
  time_label: string | null;
  room: string | null;
  is_active: boolean;
}

interface LiveEvent {
  id: string;
  title: string;
  slug: string;
  conference_name: string;
  conference_location: string;
  event_date: string;
  rehearsal_mode: boolean;
  requires_code: boolean;
  access_code: string | null;
}

interface LiveSessionEntryProps {
  event: LiveEvent;
  sessions: Session[];
}

export default function LiveSessionEntry({ event, sessions }: LiveSessionEntryProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [codeVerified, setCodeVerified] = useState(!event.requires_code);
  const [joining, setJoining] = useState(false);

  const verifyCode = () => {
    if (code.trim().toLowerCase() === event.access_code?.toLowerCase()) {
      setCodeVerified(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const joinSession = (sessionId?: string) => {
    setJoining(true);
    const url = `/conference/${event.slug}${sessionId ? `?session=${sessionId}` : ""}`;
    router.push(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "#0D1117" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Live badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(16,185,129,0.1)", border: "0.5px solid rgba(16,185,129,0.3)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-400 tracking-wide">
              {event.rehearsal_mode ? "Rehearsal" : "Live now"}
            </span>
          </div>
        </div>

        {/* Event info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {event.conference_name}
          </h1>
          <p className="text-sm text-[#8B949E]">{event.conference_location}</p>
        </div>

        {/* Access code gate */}
        {!codeVerified ? (
          <div className="space-y-3">
            <p className="text-sm text-center text-[#8B949E] mb-4">Enter today's code to join</p>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(false); }}
              onKeyDown={(e) => e.key === "Enter" && verifyCode()}
              placeholder="e.g. RENO25"
              maxLength={20}
              className="w-full text-center text-xl font-bold tracking-widest rounded-2xl px-4 py-4 outline-none"
              style={{
                background: "#161B22",
                border: codeError ? "1px solid rgba(239,68,68,0.5)" : "1px solid #21262D",
                color: "#E6EDF3",
                letterSpacing: "0.15em",
              }}
              autoFocus
            />
            {codeError && (
              <p className="text-xs text-center text-red-400">Incorrect code — check with Keith</p>
            )}
            <button
              onClick={verifyCode}
              className="w-full py-4 rounded-2xl text-base font-bold transition-all"
              style={{ background: "#34d399", color: "#052e16" }}
            >
              Enter
            </button>
          </div>
        ) : sessions.length === 0 ? (
          /* No active sessions yet */
          <div className="text-center space-y-4">
            <p className="text-[#8B949E] text-sm">Session starting soon — stay on this screen.</p>
            <button
              onClick={() => joinSession()}
              disabled={joining}
              className="w-full py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-50"
              style={{ background: "#34d399", color: "#052e16" }}
            >
              {joining ? "Joining…" : "Join Event"}
            </button>
          </div>
        ) : sessions.length === 1 ? (
          /* One session — go straight in */
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "0.5px solid #21262D" }}>
              <p className="text-sm font-semibold text-white">{sessions[0].title}</p>
              {sessions[0].speaker && <p className="text-xs text-[#8B949E] mt-1">{sessions[0].speaker}</p>}
              {sessions[0].time_label && <p className="text-xs text-[#8B949E]">{sessions[0].time_label}</p>}
            </div>
            <button
              onClick={() => joinSession(sessions[0].id)}
              disabled={joining}
              className="w-full py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-50"
              style={{ background: "#34d399", color: "#052e16" }}
            >
              {joining ? "Joining…" : "Join session"}
            </button>
          </div>
        ) : (
          /* Multiple sessions — show list */
          <div className="space-y-3">
            <p className="text-xs text-center text-[#8B949E] mb-2 uppercase tracking-wider font-semibold">Select your session</p>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => joinSession(session.id)}
                disabled={joining}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all disabled:opacity-50"
                style={{ background: "#161B22", border: "0.5px solid #21262D" }}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{session.title}</p>
                  <p className="text-xs text-[#8B949E] mt-0.5">
                    {[session.speaker, session.room, session.time_label].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="text-[#2764FF] text-lg ml-3">›</span>
              </button>
            ))}
          </div>
        )}

        {/* Escape hatch */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-[#8B949E] hover:text-white transition-colors"
          >
            Browse Keith's site →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
