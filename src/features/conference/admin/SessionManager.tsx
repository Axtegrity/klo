"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Power,
  Trash2,
  MessageSquare,
  Eye,
  Clock,
  MapPin,
  User,
  RefreshCw,
  Pencil,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import type { ConferenceSession } from "../types";

interface SessionManagerProps {
  eventId?: string;
}

export default function SessionManager({ eventId }: SessionManagerProps = {}) {
  const [sessions, setSessions] = useState<ConferenceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [room, setRoom] = useState("");
  const [timeLabel, setTimeLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [autoFetch, setAutoFetch] = useState(false);
  const [autoFetchLoading, setAutoFetchLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({
    title: "",
    description: "",
    speaker: "",
    room: "",
    time_label: "",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const url = eventId
        ? `/api/conference/sessions?event_id=${eventId}`
        : "/api/conference/sessions";
      const res = await fetch(url);
      if (res.ok) setSessions(await res.json());
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchAutoFetchSetting = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/settings?key=auto_fetch_schedule");
      if (res.ok) {
        const data = await res.json();
        setAutoFetch(data.value === "true");
      }
    } finally {
      setAutoFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchAutoFetchSetting();
  }, [fetchSessions, fetchAutoFetchSetting]);

  const toggleAutoFetch = async () => {
    const newValue = !autoFetch;
    setAutoFetch(newValue);
    await fetch("/api/conference/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "auto_fetch_schedule", value: String(newValue) }),
    });
  };

  const createSession = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/conference/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          speaker: speaker || undefined,
          room: room || undefined,
          time_label: timeLabel || undefined,
          ...(eventId ? { event_id: eventId } : {}),
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setSpeaker("");
        setRoom("");
        setTimeLabel("");
        setShowCreateForm(false);
        fetchSessions();
      }
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (s: ConferenceSession) => {
    setEditingId(s.id);
    setEditFields({
      title: s.title,
      description: s.description || "",
      speaker: s.speaker || "",
      room: s.room || "",
      time_label: s.time_label || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editFields.title.trim()) return;
    await fetch(`/api/conference/sessions/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editFields.title,
        description: editFields.description,
        speaker: editFields.speaker,
        room: editFields.room,
        time_label: editFields.time_label,
      }),
    });
    setEditingId(null);
    fetchSessions();
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    await fetch(`/api/conference/sessions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentlyActive }),
    });
    fetchSessions();
  };

  const toggleQA = async (id: string, currentValue: boolean) => {
    await fetch(`/api/conference/sessions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qa_enabled: !currentValue }),
    });
    fetchSessions();
  };

  const setReleaseMode = async (id: string, mode: string) => {
    await fetch(`/api/conference/sessions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ release_mode: mode }),
    });
    fetchSessions();
  };

  const deleteSession = async (id: string) => {
    await fetch(`/api/conference/sessions/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    fetchSessions();
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && title.trim()) {
      e.preventDefault();
      createSession();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto-fetch toggle */}
      {!autoFetchLoading && (
        <div className="glass rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw size={16} className="text-[#2764FF]" />
            <div>
              <p className="text-sm font-medium text-klo-text">Auto-fetch schedule from web</p>
              <p className="text-xs text-klo-muted">Syncs every 7 days via n8n automation</p>
            </div>
          </div>
          <button
            onClick={toggleAutoFetch}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              autoFetch ? "bg-emerald-500" : "bg-klo-slate"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                autoFetch ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      )}

      {/* Create form toggle */}
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full glass rounded-2xl p-4 border border-dashed border-white/10 hover:border-[#2764FF]/30 transition-colors flex items-center justify-center gap-2 text-sm text-klo-muted hover:text-klo-text"
        >
          <Plus size={16} />
          Add New Session
        </button>
      ) : (
        <div className="glass rounded-2xl p-5 border border-[#2764FF]/20 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-klo-text">New Session</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="p-1 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div>
            <label className="block text-xs text-klo-muted mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              placeholder="e.g. Opening Keynote: AI and the Future of Leadership"
              className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-klo-muted mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              placeholder="Brief description of the session..."
              className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-klo-muted mb-1">Speaker</label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                placeholder="e.g. Keith L. Odom"
                className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-klo-muted mb-1">Room</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                placeholder="e.g. Grand Ballroom A"
                className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-klo-muted mb-1">Time</label>
              <input
                type="text"
                value={timeLabel}
                onChange={(e) => setTimeLabel(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                placeholder="e.g. 9:00 AM - 10:15 AM"
                className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={createSession}
              disabled={!title.trim() || creating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 disabled:opacity-40"
            >
              <Plus size={16} />
              {creating ? "Creating..." : "Create Session"}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm text-klo-muted hover:text-klo-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session list */}
      {sessions.map((s) => (
        <div
          key={s.id}
          className={`glass rounded-2xl p-4 border ${
            s.is_active ? "border-emerald-500/30" : "border-white/5"
          }`}
        >
          {editingId === s.id ? (
            /* ---------- Inline Edit Mode ---------- */
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-klo-muted mb-1">Title *</label>
                <input
                  type="text"
                  value={editFields.title}
                  onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                  onKeyDown={handleEditKeyDown}
                  className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text focus:outline-none focus:border-[#2764FF]/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-klo-muted mb-1">Description</label>
                <input
                  type="text"
                  value={editFields.description}
                  onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                  onKeyDown={handleEditKeyDown}
                  className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text focus:outline-none focus:border-[#2764FF]/50"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-klo-muted mb-1">Speaker</label>
                  <input
                    type="text"
                    value={editFields.speaker}
                    onChange={(e) => setEditFields({ ...editFields, speaker: e.target.value })}
                    onKeyDown={handleEditKeyDown}
                    className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text focus:outline-none focus:border-[#2764FF]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-klo-muted mb-1">Room</label>
                  <input
                    type="text"
                    value={editFields.room}
                    onChange={(e) => setEditFields({ ...editFields, room: e.target.value })}
                    onKeyDown={handleEditKeyDown}
                    className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text focus:outline-none focus:border-[#2764FF]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-klo-muted mb-1">Time</label>
                  <input
                    type="text"
                    value={editFields.time_label}
                    onChange={(e) => setEditFields({ ...editFields, time_label: e.target.value })}
                    onKeyDown={handleEditKeyDown}
                    className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text focus:outline-none focus:border-[#2764FF]/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={saveEdit}
                  disabled={!editFields.title.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-sm rounded-lg hover:bg-emerald-500/30 disabled:opacity-40 transition-colors"
                >
                  <Check size={14} />
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-klo-muted hover:text-klo-text transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ---------- Display Mode ---------- */
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-klo-text">{s.title}</p>
                    {s.is_active && (
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-xs text-klo-muted mt-1">{s.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-klo-muted">
                    {s.time_label && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {s.time_label}
                      </span>
                    )}
                    {s.speaker && (
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {s.speaker}
                      </span>
                    )}
                    {s.room && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {s.room}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 ${s.qa_enabled ? "text-emerald-400" : "text-red-400"}`}>
                      <MessageSquare size={12} />
                      Q&A: {s.qa_enabled ? "On" : "Off"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      Release: {s.release_mode}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  <button
                    onClick={() => startEdit(s)}
                    className="p-2 rounded-lg text-klo-muted hover:text-[#2764FF] hover:bg-[#2764FF]/10 transition-colors"
                    title="Edit session"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => toggleActive(s.id, s.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      s.is_active
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : "text-klo-muted hover:bg-white/5"
                    }`}
                    title={s.is_active ? "Deactivate" : "Activate"}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    onClick={() => toggleQA(s.id, s.qa_enabled)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      s.qa_enabled
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    }`}
                    title={s.qa_enabled ? "Disable Q&A" : "Enable Q&A"}
                  >
                    <MessageSquare size={12} />
                    {s.qa_enabled ? "Q&A On" : "Q&A Off"}
                  </button>
                  {deleteConfirmId === s.id ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => deleteSession(s.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1.5 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(s.id)}
                      className="p-2 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Release mode selector */}
              <div className="mt-3 flex gap-2">
                {(["all", "single", "hide_all"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setReleaseMode(s.id, mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      s.release_mode === mode
                        ? "bg-[#2764FF]/20 text-[#2764FF] border border-[#2764FF]/30"
                        : "bg-klo-navy/50 text-klo-muted hover:text-klo-text border border-white/5"
                    }`}
                  >
                    {mode === "all" ? "Show All" : mode === "single" ? "Single Release" : "Hide All"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ))}

      {sessions.length === 0 && !showCreateForm && (
        <div className="text-center py-8">
          <p className="text-sm text-klo-muted mb-3">No sessions created yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110"
          >
            <Plus size={16} />
            Create Your First Session
          </button>
        </div>
      )}
    </div>
  );
}
