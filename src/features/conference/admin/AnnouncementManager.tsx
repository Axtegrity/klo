"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Trash2, Megaphone } from "lucide-react";
import { useConferenceRealtime } from "../hooks/useConferenceRealtime";

interface Announcement {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

interface AnnouncementManagerProps {
  eventId?: string;
}

export default function AnnouncementManager({ eventId }: AnnouncementManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const url = eventId
        ? `/api/conference/announcements?event_id=${eventId}`
        : "/api/conference/announcements";
      const res = await fetch(url);
      if (res.ok) setAnnouncements(await res.json());
    } catch {
      // keep current state
    }
  }, [eventId]);

  useConferenceRealtime({ onAnnouncementsChange: fetchAnnouncements });

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const pushAnnouncement = async () => {
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/conference/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), ...(eventId ? { event_id: eventId } : {}) }),
      });
      if (res.ok) {
        setTitle("");
        setMessage("");
        fetchAnnouncements();
      }
    } finally {
      setSending(false);
    }
  };

  const dismissAnnouncement = async (id: string) => {
    await fetch(`/api/conference/announcements?id=${id}`, { method: "DELETE" });
    fetchAnnouncements();
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-klo-text mb-4 flex items-center gap-2">
          <Megaphone size={16} className="text-klo-gold" />
          Push Announcement
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
            className="w-full bg-klo-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-[#2764FF]/50"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message to attendees..."
            rows={3}
            className="w-full bg-klo-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-[#2764FF]/50"
          />
          <button
            onClick={pushAnnouncement}
            disabled={sending || !title.trim() || !message.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {sending ? "Sending..." : "Push to Attendees"}
          </button>
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-klo-muted uppercase tracking-wider">
            Active Announcements
          </h4>
          {announcements.map((a) => (
            <div
              key={a.id}
              className="glass rounded-xl p-4 border border-white/5 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-klo-text">{a.title}</p>
                <p className="text-xs text-klo-muted mt-1">{a.message}</p>
                <p className="text-xs text-klo-muted/60 mt-1">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => dismissAnnouncement(a.id)}
                className="p-2 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Dismiss"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
