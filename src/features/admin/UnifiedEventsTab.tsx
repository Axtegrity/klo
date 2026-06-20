"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Trash2, Upload, ChevronDown, ChevronUp, Calendar,
  FileText, RefreshCw, Globe, Loader2, Radio, Search, Eye, EyeOff,
  ArrowLeft, MessageSquare, Cloud, Megaphone, Shield,
  Archive, ChevronRight,
} from "lucide-react";
import Modal from "@/components/shared/Modal";
import QuestionModerator from "@/features/conference/admin/QuestionModerator";
import WordCloudManager from "@/features/conference/admin/WordCloudManager";
import SessionManagerWithPolls from "@/features/conference/admin/SessionManagerWithPolls";
import PresenterRemote from "@/features/conference/admin/PresenterRemote";
import RoleManager from "@/features/conference/admin/RoleManager";
import ProfanityManager from "@/features/conference/admin/ProfanityManager";
import AnnouncementManager from "@/features/conference/admin/AnnouncementManager";
import SessionHistory from "@/features/conference/admin/SessionHistory";
import { CONFERENCE_COLORS } from "@/features/conference/constants";

const GOLD = CONFERENCE_COLORS.gold;

// ── Types ──────────────────────────────────────────────────────────────

interface EventFile {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: string | null;
  is_visible: boolean;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  conference_name: string;
  conference_location: string;
  event_category: string;
  description: string | null;
  notes: string | null;
  event_date: string;
  event_time: string | null;
  event_timezone: string | null;
  is_published: boolean;
  is_featured: boolean;
  access_code: string | null;
  seminar_mode: boolean;
  website_url: string | null;
  start_date: string | null;
  end_date: string | null;
  session_name: string | null;
  room_location: string | null;
  is_guest_presenter: boolean;
  session_end_time: string | null;
  display_name_mode: string;
  hosting_entity: string | null;
  display_on_events_page: boolean;
  event_status: string;
  event_status_override: boolean;
  pinned_as_next: boolean;
  event_files: EventFile[];
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatEventDate(ev: Event): string {
  if (ev.event_date === "SAVE THE DATE") return "Save the Date";
  const start = ev.start_date || ev.event_date;
  const end = ev.end_date || ev.event_date;
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  if (start === end) return fmt(start);
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`;
  }
  return `${fmt(start)} – ${fmt(end)}`;
}

function isEventPast(ev: Event): boolean {
  if (ev.seminar_mode) return false;
  if (ev.event_status === "past") return true;
  if (!ev.event_date || ev.event_date === "SAVE THE DATE") return false;
  const endStr = ev.end_date || ev.event_date;
  return new Date(endStr + "T23:59:59") < new Date();
}

// ── Accordion section wrapper ──────────────────────────────────────────

function Section({
  title, icon: Icon, children, defaultOpen = false, badge, forceClose = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  forceClose?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceClose ? false : open;
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "#161B22", borderColor: "#21262D" }}>
      <button
        className={`w-full flex items-center justify-between px-4 py-4 text-left transition-colors ${forceClose ? "opacity-40 cursor-default" : "hover:bg-white/[0.02]"}`}
        onClick={() => !forceClose && setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className="text-[#8B949E] shrink-0" />
          <span className="text-sm font-semibold text-white">{title}</span>
          {badge !== undefined && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(39,100,255,0.15)", color: "#60a5fa" }}>
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-[#8B949E] shrink-0" /> : <ChevronDown size={16} className="text-[#8B949E] shrink-0" />}
      </button>
      {isOpen && <div className="px-4 pb-4 border-t" style={{ borderColor: "#21262D" }}>{children}</div>}
    </div>
  );
}

// ── Event Detail View ──────────────────────────────────────────────────

function EventDetail({ event, onBack, onRefresh }: {
  event: Event;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [ev, setEv] = useState<Event>(event);

  useEffect(() => {
    setEv(event);
  }, [event]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLive, setIsLive] = useState(ev.seminar_mode);
  const [goingLive, setGoingLive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activatingSession, setActivatingSession] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<"sequential" | "simultaneous">("sequential");
  const [sessions, setSessions] = useState<{ id: string; title: string; time_label?: string | null }[]>([]);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Spotlight state
  const [spotlightLoading, setSpotlightLoading] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [cardPosition, setCardPosition] = useState<"above" | "below">("above");
  const [autoPick, setAutoPick] = useState(true);
  const [showLive, setShowLive] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showPast, setShowPast] = useState(true);

  const [sessionCount, setSessionCount] = useState(0);

  const refreshSessions = useCallback(async () => {
    try {
      const [activeRes, allRes] = await Promise.all([
        fetch(`/api/conference/sessions?event_id=${ev.id}&active_only=true`),
        fetch(`/api/conference/sessions?event_id=${ev.id}`),
      ]);
      const activeData = await activeRes.json();
      const allData = await allRes.json();
      if (Array.isArray(activeData) && activeData.length > 0) setActiveSessionId(activeData[0].id);
      if (Array.isArray(allData)) setSessions(allData);
    } catch {
      // keep current state
    }
  }, [ev.id]);

  useEffect(() => {
    refreshSessions();
    fetch(`/api/conference/polls?event_id=${ev.id}`)
      .then(r => r.json())
      .catch(() => {});
    fetch(`/api/conference/sessions?event_id=${ev.id}`)
      .then(r => r.json())
      .then(d => setSessionCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
    fetch("/api/spotlight")
      .then(r => r.json())
      .then(d => {
        if (d) {
          setShowCountdown(d.show_countdown ?? false);
          setCardPosition(d.card_position ?? "above");
          setAutoPick(d.event?.id !== ev.id);
          setShowLive(d.show_live_section ?? true);
          setShowUpcoming(d.show_upcoming_section ?? true);
          setShowPast(d.show_past_section ?? true);
        }
      })
      .catch(() => {});
  }, [ev.id]);

  const update = (field: keyof Event, value: unknown) => {
    setEv((prev) => ({ ...prev, [field]: value }));
  };

  const saveDetails = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ev.title,
          conference_name: ev.conference_name,
          conference_location: ev.conference_location,
          description: ev.description,
          notes: ev.notes,
          event_date: ev.event_date,
          start_date: ev.start_date,
          end_date: ev.end_date,
          event_time: ev.event_time,
          event_timezone: ev.event_timezone,
          website_url: ev.website_url,
          session_name: ev.session_name,
          room_location: ev.room_location,
          hosting_entity: ev.hosting_entity,
          display_name_mode: ev.display_name_mode,
          is_guest_presenter: ev.is_guest_presenter,
          access_code: ev.access_code,
          display_on_events_page: ev.display_on_events_page,
          is_featured: ev.is_featured,
          event_status: ev.event_status,
          pinned_as_next: ev.pinned_as_next,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error || "Failed to save");
        return;
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const toggleLive = async () => {
    setGoingLive(true);
    const newMode = !isLive;
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seminar_mode: newMode }),
      });
      if (res.ok) {
        setIsLive(newMode);
        setEv((prev) => ({ ...prev, seminar_mode: newMode }));
        onRefresh();
      }
    } finally {
      setGoingLive(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/events/${ev.id}/files`, { method: "POST", body: formData });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setUploadError(d.error || "Upload failed");
        return;
      }
      const fresh = await fetch(`/api/admin/events/${ev.id}`);
      if (fresh.ok) {
        const d = await fresh.json();
        setEv((prev) => ({ ...prev, event_files: d.event_files ?? prev.event_files }));
      }
    } finally {
      setUploading(false);
    }
  };

  const toggleFileVisibility = async (fileId: string, current: boolean) => {
    await fetch(`/api/admin/events/${ev.id}/files?fileId=${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !current }),
    });
    setEv((prev) => ({
      ...prev,
      event_files: prev.event_files.map((f) =>
        f.id === fileId ? { ...f, is_visible: !current } : f
      ),
    }));
  };

  const deleteFile = async (fileId: string) => {
    await fetch(`/api/admin/events/${ev.id}/files?fileId=${fileId}`, { method: "DELETE" });
    setEv((prev) => ({ ...prev, event_files: prev.event_files.filter((f) => f.id !== fileId) }));
  };

  const saveSpotlight = async () => {
    setSpotlightLoading(true);
    try {
      await fetch("/api/spotlight", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: autoPick ? null : ev.id,
          show_countdown: showCountdown,
          card_position: cardPosition,
          show_live_section: showLive,
          show_upcoming_section: showUpcoming,
          show_past_section: showPast,
        }),
      });
    } finally {
      setSpotlightLoading(false);
    }
  };

  const inputCls = "w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2764FF]/50 placeholder:text-[#8B949E]";
  const labelCls = "text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-1 block";

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate">{ev.conference_name || ev.title}</h2>
          <p className="text-xs text-[#8B949E]">{formatEventDate(ev)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold ${isLive ? "text-emerald-400" : "text-[#8B949E]"}`}>
            {isLive ? "LIVE" : "OFF"}
          </span>
          <button
            onClick={toggleLive}
            disabled={goingLive}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${isLive ? "bg-emerald-500" : "bg-[#21262D]"}`}
            role="switch"
            aria-checked={isLive}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isLive ? "translate-x-5" : ""}`} />
          </button>
          {!isLive && (
            deleteConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    await fetch(`/api/admin/events/${ev.id}`, { method: "DELETE" });
                    setDeleteConfirm(false);
                    onBack();
                    onRefresh();
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2.5 py-1 rounded-lg text-xs text-[#8B949E] hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-1.5 rounded-lg text-[#8B949E] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete event"
              >
                <Trash2 size={14} />
              </button>
            )
          )}
        </div>
      </div>

      {/* ── 1. DETAILS ── */}
      <Section title="Details" icon={FileText} forceClose={isLive}>
        <div className="space-y-4 pt-4">
          {saveError && <p className="text-xs text-red-400">{saveError}</p>}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Event Name</label>
              <input className={inputCls} value={ev.conference_name} onChange={(e) => update("conference_name", e.target.value)} placeholder="Conference name" />
            </div>
            <div>
              <label className={labelCls}>Title / Session</label>
              <input className={inputCls} value={ev.title} onChange={(e) => { update("title", e.target.value); update("session_name", e.target.value); }} placeholder="e.g. AI & The Future of Ministry" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start Date</label>
                <input type="date" className={inputCls} value={ev.start_date || ev.event_date} onChange={(e) => { update("start_date", e.target.value); update("event_date", e.target.value); }} />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input type="date" className={inputCls} value={ev.end_date || ""} onChange={(e) => update("end_date", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Time</label>
                <input type="time" className={inputCls} value={ev.event_time || ""} onChange={(e) => update("event_time", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Timezone</label>
                <input className={inputCls} value={ev.event_timezone || ""} onChange={(e) => update("event_timezone", e.target.value)} placeholder="America/Chicago" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input className={inputCls} value={ev.conference_location} onChange={(e) => update("conference_location", e.target.value)} placeholder="City, State" />
            </div>
            <div>
              <label className={labelCls}>Room / Venue</label>
              <input className={inputCls} value={ev.room_location || ""} onChange={(e) => update("room_location", e.target.value)} placeholder="Room or venue name" />
            </div>
            <div>
              <label className={labelCls}>Website URL</label>
              <input className={inputCls} value={ev.website_url || ""} onChange={(e) => update("website_url", e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className={labelCls}>Hosting Entity</label>
              <input className={inputCls} value={ev.hosting_entity || ""} onChange={(e) => update("hosting_entity", e.target.value)} placeholder="Organization hosting the event" />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={`${inputCls} min-h-[80px] resize-y`} value={ev.description || ""} onChange={(e) => update("description", e.target.value)} placeholder="Public description" />
            </div>
            <div>
              <label className={labelCls}>Notes (internal)</label>
              <textarea className={`${inputCls} min-h-[80px] resize-y`} value={ev.notes || ""} onChange={(e) => update("notes", e.target.value)} placeholder="Internal notes — not shown publicly" />
            </div>
            <div>
              <label className={labelCls}>Access Code</label>
              <input className={inputCls} value={ev.access_code || ""} onChange={(e) => update("access_code", e.target.value)} placeholder="Leave blank for open access" />
            </div>
            <div>
              <label className={labelCls}>Event Status</label>
              <select className={inputCls} value={ev.event_status} onChange={(e) => update("event_status", e.target.value)}>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t" style={{ borderColor: "#21262D" }}>
            {[
              { label: "Show on Events Page", field: "display_on_events_page" as keyof Event },
              { label: "Feature on Home Page", field: "is_featured" as keyof Event },
              { label: "Guest Presenter", field: "is_guest_presenter" as keyof Event },
              { label: "Pin as Up Next", field: "pinned_as_next" as keyof Event },
            ].map(({ label, field }) => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-sm text-[#8B949E]">{label}</span>
                <button
                  onClick={() => update(field, !ev[field])}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${ev[field] ? "bg-[#2764FF]" : "bg-[#21262D]"}`}
                  role="switch"
                  aria-checked={!!ev[field]}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${ev[field] ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={saveDetails}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:brightness-110"
            style={{ background: GOLD, color: "#0D1117" }}
          >
            {saving ? "Saving…" : saveSuccess ? "Saved ✓" : "Save Details"}
          </button>
        </div>
      </Section>

      {/* ── 2. SESSIONS ── */}
      <Section title="Sessions" icon={Radio} badge={sessionCount} forceClose={isLive}>
        <div className="pt-4">
          <SessionManagerWithPolls eventId={ev.id} onSessionsChange={refreshSessions} />
        </div>
      </Section>

      {/* Polls live inside sessions — see Sessions section above */}

      {/* ── 4. Q&A ── */}
      <Section title="Q&A" icon={MessageSquare} forceClose={isLive}>
        <div className="pt-4">
          <QuestionModerator eventId={ev.id} />
        </div>
      </Section>

      {/* ── 5. WORD CLOUD ── */}
      <Section title="Word Cloud" icon={Cloud} forceClose={isLive}>
        <div className="pt-4">
          <WordCloudManager eventId={ev.id} />
        </div>
      </Section>

      {/* ── 6. ANNOUNCEMENTS ── */}
      <Section title="Announcements" icon={Megaphone} forceClose={isLive}>
        <div className="pt-4">
          <AnnouncementManager eventId={ev.id} />
        </div>
      </Section>

      {/* ── 8. ROLES ── */}
      <Section title="Roles" icon={Shield} forceClose={isLive}>
        <div className="pt-4 space-y-4">
          <RoleManager eventId={ev.id} />
          <div className="border-t pt-4" style={{ borderColor: "#21262D" }}>
            <p className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-3">Profanity Filter</p>
            <ProfanityManager />
          </div>
        </div>
      </Section>

      {/* ── 9. PUBLISH ── */}
      <Section title={isLive ? "🔴 Live — Run Your Session" : "Publish & Spotlight"} icon={Globe} defaultOpen={isLive}>
        <div className="pt-4 space-y-5">
            {/* Rehearse + Reset */}
            <div className="flex gap-3">
              <a
                href={`/conference/${ev.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "rgba(39,100,255,0.1)", color: "#60a5fa", border: "1px solid rgba(39,100,255,0.3)" }}
              >
                Rehearse →
              </a>
              <button
                onClick={async () => {
                  if (!window.confirm("Reset all polls? This clears all test votes.")) return;
                  await fetch(`/api/conference/polls/reset?event_id=${ev.id}`, { method: "POST" });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "rgba(107,114,128,0.1)", color: "#9CA3AF", border: "1px solid rgba(107,114,128,0.2)" }}
              >
                Reset
              </button>
            </div>

          {/* Go Live toggle */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: isLive ? "rgba(16,185,129,0.05)" : "rgba(39,100,255,0.05)", borderColor: isLive ? "rgba(16,185,129,0.2)" : "rgba(39,100,255,0.2)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{isLive ? "Event is Live" : "Go Live"}</p>
                <p className="text-xs text-[#8B949E] mt-0.5">{isLive ? "Attendees can see engagement tools" : "Flip to make engagement tools visible to attendees"}</p>
              </div>
              <button
                onClick={toggleLive}
                disabled={goingLive}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${isLive ? "bg-emerald-500" : "bg-[#21262D]"}`}
                role="switch"
                aria-checked={isLive}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isLive ? "translate-x-5" : ""}`} />
              </button>
            </div>
          </div>

          {/* Live run panel — appears when event is live */}
          {isLive && (
            <div className="space-y-4">
              {!activeSessionId ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold tracking-widest text-[#8B949E]">SELECT A SESSION TO START</p>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-[#8B949E]">No sessions found. Add a session above first.</p>
                  ) : (
                    sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={async () => {
                          setActivatingSession(s.id);
                          await fetch(`/api/conference/sessions/${s.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ is_active: true }),
                          });
                          setActiveSessionId(s.id);
                          setActivatingSession(null);
                        }}
                        disabled={activatingSession === s.id}
                        className="w-full text-left px-4 py-4 rounded-2xl border transition-all disabled:opacity-50 hover:border-[#C8A84E]/40"
                        style={{ background: "#0D1117", borderColor: "#21262D" }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{s.title}</p>
                            {s.time_label && <p className="text-xs text-[#8B949E] mt-0.5">{s.time_label}</p>}
                          </div>
                          <span className="text-xs font-bold" style={{ color: GOLD }}>
                            {activatingSession === s.id ? "Starting..." : "START →"}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-pulse bg-red-500" />
                      <span className="text-xs font-bold tracking-widest text-red-400">SESSION LIVE</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (!window.confirm("End this session? Results will be archived.")) return;
                        await fetch(`/api/conference/sessions/${activeSessionId}/end`, { method: "POST" });
                        setActiveSessionId(null);
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                    >
                      End Session
                    </button>
                  </div>
                  {/* Deploy mode selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await fetch(`/api/conference/sessions/${activeSessionId}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ session_mode: "sequential" }),
                        });
                        setSessionMode("sequential");
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${sessionMode === "sequential" ? "bg-[#2764FF] text-white" : "bg-[#21262D] text-[#8B949E] hover:text-white"}`}
                    >
                      One at a Time
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/conference/sessions/${activeSessionId}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ session_mode: "simultaneous" }),
                        });
                        setSessionMode("simultaneous");
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${sessionMode === "simultaneous" ? "bg-purple-500 text-white" : "bg-[#21262D] text-[#8B949E] hover:text-white"}`}
                    >
                      Deploy All
                    </button>
                  </div>
                  <PresenterRemote eventId={ev.id} sessionId={activeSessionId} />
                </div>
              )}
            </div>
          )}

          {/* Spotlight controls */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">Public Events Page</p>
            {[
              { label: "Show Countdown Timer", value: showCountdown, set: setShowCountdown },
              { label: "Show Live Section", value: showLive, set: setShowLive },
              { label: "Show Upcoming Section", value: showUpcoming, set: setShowUpcoming },
              { label: "Show Past Section", value: showPast, set: setShowPast },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-[#8B949E]">{label}</span>
                <button
                  onClick={() => set(!value)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${value ? "bg-[#2764FF]" : "bg-[#21262D]"}`}
                  role="switch"
                  aria-checked={value}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B949E]">Card Position</span>
              <select
                value={cardPosition}
                onChange={(e) => setCardPosition(e.target.value as "above" | "below")}
                className="bg-[#0D1117] border border-[#30363D] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
              >
                <option value="above">Above Countdown</option>
                <option value="below">Below Countdown</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B949E]">Spotlight this event</span>
              <button
                onClick={() => setAutoPick(!autoPick)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${!autoPick ? "bg-[#2764FF]" : "bg-[#21262D]"}`}
                role="switch"
                aria-checked={!autoPick}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${!autoPick ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <button
              onClick={saveSpotlight}
              disabled={spotlightLoading}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "rgba(39,100,255,0.15)", color: "#60a5fa", border: "1px solid rgba(39,100,255,0.3)" }}
            >
              {spotlightLoading ? "Saving…" : "Save Page Settings"}
            </button>
          </div>
        </div>
      </Section>

      {/* ── 10. HISTORY ── */}
      <Section title="History" icon={Archive} forceClose={isLive}>
        <div className="pt-4">
          <SessionHistory eventId={ev.id} />
        </div>
      </Section>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────

export default function UnifiedEventsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    searchParams.get("event") ?? null
  );

  // Create event modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) setEvents(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Keep URL in sync
  useEffect(() => {
    if (selectedEventId) {
      router.replace(`/admin?tab=events&event=${selectedEventId}`, { scroll: false });
    } else {
      router.replace(`/admin?tab=events`, { scroll: false });
    }
  }, [selectedEventId, router]);

  const handleCreateEvent = async () => {
    if (!createName.trim() || !createDate.trim()) {
      setCreateError("Event name and date are required");
      return;
    }
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createName.trim(),
          conference_name: createName.trim(),
          event_date: createDate,
          start_date: createDate,
          conference_location: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create event");
        return;
      }
      setCreateOpen(false);
      setCreateName("");
      setCreateDate("");
      await fetchEvents();
      setSelectedEventId(data.id);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}
        onBack={() => setSelectedEventId(null)}
        onRefresh={fetchEvents}
      />
    );
  }

  const filtered = events.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.conference_name.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.conference_location.toLowerCase().includes(q)
    );
  });

  const upcoming = filtered.filter((e) => !isEventPast(e));
  const past = filtered.filter((e) => isEventPast(e));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Events</h2>
          <p className="text-xs text-[#8B949E]">Tap an event to set it up and go live.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition-all"
          style={{ background: GOLD, color: "#0D1117" }}
        >
          <Plus size={15} />
          New Event
        </button>
      </div>

      {/* Create Event Modal */}
      <Modal isOpen={createOpen} onClose={() => { setCreateOpen(false); setCreateError(null); }} title="New Event">
        <div className="space-y-4">
          {createError && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{createError}</p>
            </div>
          )}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Event name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl px-4 py-3 text-sm placeholder:text-[#8B949E] focus:outline-none focus:border-[#2764FF]/50"
            />
            <input
              type="date"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2764FF]/50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setCreateOpen(false); setCreateError(null); }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[#30363D] text-[#8B949E] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateEvent}
              disabled={createSubmitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition-all disabled:opacity-50"
              style={{ background: GOLD, color: "#0D1117" }}
            >
              {createSubmitting ? "Creating…" : "Create & Set Up"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
        <input
          type="text"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#161B22] border border-[#21262D] text-white rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-[#8B949E] focus:outline-none focus:border-[#2764FF]/50"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <RefreshCw size={24} className="text-[#8B949E] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div className="rounded-2xl border p-10 text-center space-y-4" style={{ background: "#161B22", borderColor: "#21262D" }}>
          <Calendar size={32} className="text-[#8B949E] mx-auto" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">No events yet</p>
            <p className="text-xs text-[#8B949E]">Create your first event to get started.</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
            style={{ background: GOLD, color: "#0D1117" }}
          >
            <Plus size={15} />
            Create Event
          </button>
        </div>
      )}

      {/* Upcoming events */}
      {!loading && upcoming.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">Upcoming & Active</p>
          {upcoming.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEventId(ev.id)}
              className="w-full text-left rounded-2xl border p-4 hover:border-[#C8A84E]/40 transition-all"
              style={{ background: "#161B22", borderColor: ev.seminar_mode ? "rgba(16,185,129,0.3)" : "#21262D" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{ev.conference_name || ev.title}</p>
                    {ev.seminar_mode && (
                      <span className="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">LIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-[#8B949E] mt-0.5">{formatEventDate(ev)}</p>
                  {ev.conference_location && <p className="text-xs text-[#8B949E]">{ev.conference_location}</p>}
                </div>
                <ChevronRight size={16} className="text-[#8B949E] shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Past events */}
      {!loading && past.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">Past</p>
          {past.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEventId(ev.id)}
              className="w-full text-left rounded-2xl border p-4 hover:border-[#C8A84E]/40 transition-all opacity-70"
              style={{ background: "#161B22", borderColor: "#21262D" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{ev.conference_name || ev.title}</p>
                  <p className="text-xs text-[#8B949E] mt-0.5">{formatEventDate(ev)}</p>
                </div>
                <ChevronRight size={16} className="text-[#8B949E] shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
