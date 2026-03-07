"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  FileText,
  RefreshCw,
  Star,
  Globe,
  GlobeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Pencil,
  X,
  Save,
} from "lucide-react";

interface EventFile {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: string | null;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  conference_name: string;
  conference_location: string;
  event_category: string;
  description: string | null;
  event_date: string;
  is_published: boolean;
  is_featured: boolean;
  event_files: EventFile[];
}

interface ParsedEvent {
  title: string;
  conference_name: string;
  conference_location: string;
  event_date: string;
  event_category: "Current Events" | "Previous Events";
  description: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function EventsAdminTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // Document parse state
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<"idle" | "success" | "error">("idle");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([]);
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null);

  // Form state (manual single-event creation)
  const [formTitle, setFormTitle] = useState("");
  const [formConference, setFormConference] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCategory, setFormCategory] = useState<"Current Events" | "Previous Events">("Current Events");
  const [formDescription, setFormDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Event>>({});
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        setEvents(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const resetForm = () => {
    setFormTitle("");
    setFormConference("");
    setFormLocation("");
    setFormDate("");
    setFormCategory("Current Events");
    setFormDescription("");
    setParseStatus("idle");
    setParseError(null);
    setParsedEvents([]);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formConference,
          conference_name: formConference,
          conference_location: formLocation,
          event_date: formDate,
          event_category: formCategory,
          description: formDescription,
        }),
      });
      if (res.ok) {
        resetForm();
        setShowForm(false);
        fetchEvents();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateParsedEvent = async (index: number) => {
    const ev = parsedEvents[index];
    setCreatingIndex(index);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ev, title: ev.title || ev.conference_name }),
      });
      if (res.ok) {
        const remaining = parsedEvents.filter((_, i) => i !== index);
        setParsedEvents(remaining);
        fetchEvents();
        // Close form when last parsed event is created
        if (remaining.length === 0) {
          resetForm();
          setShowForm(false);
        }
      }
    } finally {
      setCreatingIndex(null);
    }
  };

  const updateParsedEvent = (index: number, field: keyof ParsedEvent, value: string) => {
    setParsedEvents((prev) =>
      prev.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev))
    );
  };

  const handleParseDocument = async (file: File) => {
    setParsing(true);
    setParseStatus("idle");
    setParseError(null);
    setParsedEvents([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/events/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setParseStatus("error");
        setParseError(data.error || "Failed to parse document");
        return;
      }
      const events: ParsedEvent[] = data.events || [];
      if (events.length === 0) {
        setParseStatus("error");
        setParseError("No events found in the document.");
        return;
      }
      setParsedEvents(events);
      setParseStatus("success");
    } catch {
      setParseStatus("error");
      setParseError("Network error. Please try again.");
    } finally {
      setParsing(false);
    }
  };

  const handleStartEdit = (event: Event) => {
    setEditingEvent(event.id);
    setEditFields({
      title: event.title,
      conference_name: event.conference_name,
      conference_location: event.conference_location,
      event_date: event.event_date,
      event_category: event.event_category,
      description: event.description || "",
    });
  };

  const handleSaveEdit = async (eventId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFields),
      });
      if (res.ok) {
        setEditingEvent(null);
        setEditFields({});
        fetchEvents();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Delete this event and all its files?")) return;
    await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    fetchEvents();
  };

  const handleUploadFile = async (eventId: string, file: File) => {
    setUploading(eventId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/events/${eventId}/files`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        fetchEvents();
      }
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteFile = async (eventId: string, fileId: string) => {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/admin/events/${eventId}/files?fileId=${fileId}`, {
      method: "DELETE",
    });
    fetchEvents();
  };

  const handleToggleFeature = async (eventId: string, currentlyFeatured: boolean) => {
    if (currentlyFeatured) {
      await fetch(`/api/admin/events/${eventId}/feature`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/events/${eventId}/feature`, { method: "POST" });
    }
    fetchEvents();
  };

  const handleTogglePublish = async (eventId: string, currentlyPublished: boolean) => {
    await fetch(`/api/admin/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !currentlyPublished }),
    });
    fetchEvents();
  };

  const currentEvents = events.filter((e) => e.event_category === "Current Events");
  const previousEvents = events.filter((e) => e.event_category === "Previous Events");

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50";

  const renderEventList = (items: Event[], label: string) => (
    <div>
      <h3 className="text-lg font-semibold text-klo-text mb-4">{label}</h3>
      {items.length === 0 ? (
        <p className="text-klo-muted text-sm">No events yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((event) => {
            const isExpanded = expandedEvent === event.id;
            return (
              <div
                key={event.id}
                className="glass rounded-2xl border border-white/5 overflow-hidden"
              >
                {/* Event header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-klo-text font-medium truncate">{event.title}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-klo-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {event.conference_location}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {event.event_files?.length ?? 0} files
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          event.is_published
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-white/5 text-klo-muted"
                        }`}
                      >
                        {event.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePublish(event.id, event.is_published);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      event.is_published
                        ? "text-emerald-400 bg-emerald-400/10"
                        : "text-klo-muted hover:text-emerald-400 hover:bg-emerald-400/10"
                    }`}
                    title={event.is_published ? "Unpublish (hide from Events page)" : "Publish (show on Events page)"}
                  >
                    {event.is_published ? <Globe size={16} /> : <GlobeOff size={16} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFeature(event.id, event.is_featured);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      event.is_featured
                        ? "text-klo-gold bg-klo-gold/10"
                        : "text-klo-muted hover:text-klo-gold hover:bg-klo-gold/10"
                    }`}
                    title={event.is_featured ? "Remove from homepage" : "Feature on homepage"}
                  >
                    <Star size={16} fill={event.is_featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editingEvent === event.id) {
                        setEditingEvent(null);
                      } else {
                        handleStartEdit(event);
                        if (!isExpanded) setExpandedEvent(event.id);
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      editingEvent === event.id
                        ? "text-blue-400 bg-blue-400/10"
                        : "text-klo-muted hover:text-blue-400 hover:bg-blue-400/10"
                    }`}
                    title="Edit event"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-klo-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-klo-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-klo-muted" />
                  )}
                </div>

                {/* Inline edit form */}
                {isExpanded && editingEvent === event.id && (
                  <div className="border-t border-white/5 px-5 py-4 space-y-4">
                    <p className="text-sm font-medium text-klo-text">Edit Event</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Event Title"
                        value={editFields.title ?? ""}
                        onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Conference Name"
                        value={editFields.conference_name ?? ""}
                        onChange={(e) => setEditFields({ ...editFields, conference_name: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={editFields.conference_location ?? ""}
                        onChange={(e) => setEditFields({ ...editFields, conference_location: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="date"
                        value={(editFields.event_date ?? "").slice(0, 10)}
                        onChange={(e) => setEditFields({ ...editFields, event_date: e.target.value })}
                        className={inputClass}
                      />
                      <select
                        value={editFields.event_category ?? "Current Events"}
                        onChange={(e) => setEditFields({ ...editFields, event_category: e.target.value })}
                        className={inputClass}
                      >
                        <option value="Current Events">Current Events</option>
                        <option value="Previous Events">Previous Events</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Description"
                      value={(editFields.description as string) ?? ""}
                      onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                      rows={3}
                      className={inputClass}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSaveEdit(event.id)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Save size={14} />
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => { setEditingEvent(null); setEditFields({}); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-klo-muted text-sm hover:text-klo-text transition-colors"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded file list */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-klo-muted font-medium">Files</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-klo-accent/10 text-klo-gold hover:bg-klo-accent/20 transition-colors cursor-pointer">
                        <Upload size={14} />
                        {uploading === event.id ? "Uploading..." : "Upload File"}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
                          disabled={uploading === event.id}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadFile(event.id, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    {event.event_files?.length > 0 ? (
                      <div className="space-y-2">
                        {event.event_files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]"
                          >
                            <FileText size={14} className="text-klo-muted shrink-0" />
                            <span className="text-sm text-klo-text truncate flex-1">
                              {file.file_name}
                            </span>
                            <span className="text-xs text-klo-muted uppercase">
                              {file.file_type}
                            </span>
                            <span className="text-xs text-klo-muted">
                              {file.file_size ?? ""}
                            </span>
                            <button
                              onClick={() => handleDeleteFile(event.id, file.id)}
                              className="p-1 rounded hover:bg-red-500/10 text-klo-muted hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-klo-muted">No files uploaded</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-klo-gold animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="space-y-8"
    >
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-klo-text">Event Presentations</h2>
          <p className="text-sm text-klo-muted mt-1">
            Manage conference presentations and downloadable files
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {/* Add event form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass rounded-2xl p-6 border border-white/5 space-y-4"
        >
          {/* Document upload zone */}
          <div className="space-y-2">
            <label
              className={`flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                parsing
                  ? "border-klo-gold/30 bg-klo-gold/5"
                  : "border-white/10 hover:border-klo-gold/30 hover:bg-white/[0.02]"
              }`}
            >
              {parsing ? (
                <Loader2 size={20} className="text-klo-gold animate-spin" />
              ) : parseStatus === "success" ? (
                <CheckCircle size={20} className="text-emerald-400" />
              ) : parseStatus === "error" ? (
                <AlertCircle size={20} className="text-red-400" />
              ) : (
                <Upload size={20} className="text-klo-muted" />
              )}
              <span className="text-sm text-klo-muted">
                {parsing
                  ? "Extracting event details..."
                  : parseStatus === "success"
                  ? `Found ${parsedEvents.length} event${parsedEvents.length !== 1 ? "s" : ""}! Review and create below.`
                  : "Upload a document to auto-fill"}
              </span>
              <span className="text-xs text-klo-muted/60">
                PDF, DOC, DOCX, or TXT — supports multiple events per document
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                disabled={parsing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleParseDocument(f);
                  e.target.value = "";
                }}
              />
            </label>
            {parseStatus === "error" && parseError && (
              <p className="text-xs text-red-400 px-1">{parseError}</p>
            )}
          </div>

          {/* Parsed events — each editable and individually creatable */}
          {parsedEvents.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-klo-text">
                Review extracted events — edit any field, then create each one:
              </p>
              {parsedEvents.map((ev, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-klo-gold">Event {idx + 1} of {parsedEvents.length}</p>
                    <button
                      onClick={() => setParsedEvents((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 rounded hover:bg-red-500/10 text-klo-muted hover:text-red-400 transition-colors"
                      title="Discard this event"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Conference Name"
                      value={ev.conference_name}
                      onChange={(e) => updateParsedEvent(idx, "conference_name", e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={ev.conference_location}
                      onChange={(e) => updateParsedEvent(idx, "conference_location", e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="date"
                      value={ev.event_date}
                      onChange={(e) => updateParsedEvent(idx, "event_date", e.target.value)}
                      className={inputClass}
                    />
                    <select
                      value={ev.event_category}
                      onChange={(e) => updateParsedEvent(idx, "event_category", e.target.value)}
                      className={inputClass}
                    >
                      <option value="Current Events">Current Events</option>
                      <option value="Previous Events">Previous Events</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Description"
                    value={ev.description}
                    onChange={(e) => updateParsedEvent(idx, "description", e.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                  <button
                    onClick={() => handleCreateParsedEvent(idx)}
                    disabled={creatingIndex === idx || !ev.conference_name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {creatingIndex === idx ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        Create Event
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Divider between parsed events and manual form */}
          {parsedEvents.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 border-t border-white/5" />
              <span className="text-xs text-klo-muted">or add manually</span>
              <div className="flex-1 border-t border-white/5" />
            </div>
          )}

          {/* Manual form */}
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Conference Name"
                value={formConference}
                onChange={(e) => setFormConference(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Location (e.g., Atlanta, GA)"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className={inputClass}
              />
              <select
                value={formCategory}
                onChange={(e) =>
                  setFormCategory(e.target.value as "Current Events" | "Previous Events")
                }
                className={inputClass}
              >
                <option value="Current Events">Current Events</option>
                <option value="Previous Events">Previous Events</option>
              </select>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className={inputClass}
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Event"}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-klo-muted text-sm hover:text-klo-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Event lists */}
      {renderEventList(currentEvents, "Current Events")}
      {renderEventList(previousEvents, "Previous Events")}
    </motion.div>
  );
}
