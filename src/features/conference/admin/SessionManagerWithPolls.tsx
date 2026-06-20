"use client";

import { useState } from "react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import SessionManager from "./SessionManager";
import PollManager from "./PollManager";
import SessionFiles from "./SessionFiles";

interface Props {
  eventId: string;
  onSessionsChange?: () => void;
}

interface SessionPollsProps {
  sessionId: string;
  eventId: string;
}

function SessionPolls({ sessionId, eventId }: SessionPollsProps) {
  const [pollsOpen, setPollsOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);

  return (
    <div className="mt-3 border-t pt-3 space-y-2" style={{ borderColor: "#21262D" }}>
      {/* Polls */}
      <div>
        <button
          onClick={() => setPollsOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left px-1 py-1"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={13} className="text-[#8B949E]" />
            <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">Polls</span>
          </div>
          {pollsOpen ? <ChevronUp size={13} className="text-[#8B949E]" /> : <ChevronDown size={13} className="text-[#8B949E]" />}
        </button>
        {pollsOpen && (
          <div className="mt-3">
            <PollManager eventId={eventId} sessionId={sessionId} />
          </div>
        )}
      </div>
      {/* Files */}
      <div>
        <button
          onClick={() => setFilesOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left px-1 py-1"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={13} className="text-[#8B949E]" />
            <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">Files</span>
          </div>
          {filesOpen ? <ChevronUp size={13} className="text-[#8B949E]" /> : <ChevronDown size={13} className="text-[#8B949E]" />}
        </button>
        {filesOpen && (
          <div className="mt-3">
            <SessionFiles eventId={eventId} sessionId={sessionId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionManagerWithPolls({ eventId, onSessionsChange }: Props) {
  return (
    <div>
      <SessionManager
        eventId={eventId}
        onSessionsChange={onSessionsChange}
        renderSessionExtra={(session) => (
          <SessionPolls sessionId={session.id} eventId={eventId} />
        )}
      />
    </div>
  );
}
