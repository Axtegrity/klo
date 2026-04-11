"use client";

// Admin UI for approving testimonials and editing quotes/organizer names.
// Pairs with /api/admin/marketing/testimonials and ...[id] routes.
//
// Public marketing pages render via getApprovedTestimonials() in
// src/lib/marketing-server.ts — which filters on approved=true AND quote
// is not null. So the admin flow is: collect rating (via email link) →
// admin adds quote + organizer → admin toggles approved → public shows it.

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Star,
  Check,
  X,
  Trash2,
  Pencil,
  Save,
  MessageSquareQuote,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Modal from "@/components/shared/Modal";

interface Testimonial {
  id: string;
  event_id: string | null;
  email: string;
  rating: number;
  quote: string | null;
  organizer_name: string | null;
  approved: boolean;
  created_at: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating ? "fill-klo-gold text-klo-gold" : "text-klo-muted/30"
          }`}
        />
      ))}
    </div>
  );
}

export default function TestimonialsAdminTab() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/testimonials");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { testimonials: Testimonial[] };
      setTestimonials(data.testimonials ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTestimonials();
  }, [fetchTestimonials]);

  async function toggleApproved(t: Testimonial) {
    setSavingId(t.id);
    try {
      const res = await fetch(`/api/admin/marketing/testimonials/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !t.approved }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { testimonial: Testimonial };
      setTestimonials((prev) => prev.map((x) => (x.id === t.id ? body.testimonial : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSavingId(null);
    }
  }

  async function saveEdit(patch: {
    quote: string | null;
    organizer_name: string | null;
    rating: number;
  }) {
    if (!editing) return;
    setSavingId(editing.id);
    try {
      const res = await fetch(`/api/admin/marketing/testimonials/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { testimonial: Testimonial };
      setTestimonials((prev) =>
        prev.map((x) => (x.id === editing.id ? body.testimonial : x))
      );
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteTestimonial(id: string) {
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/marketing/testimonials/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTestimonials((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  const visible = testimonials.filter((t) => {
    if (filter === "pending") return !t.approved;
    if (filter === "approved") return t.approved;
    return true;
  });

  const pendingCount = testimonials.filter((t) => !t.approved).length;
  const approvedCount = testimonials.filter((t) => t.approved).length;
  const displayCount = testimonials.filter(
    (t) => t.approved && t.quote && t.quote.trim().length > 0
  ).length;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-klo-text font-display flex items-center gap-2">
            <MessageSquareQuote className="w-6 h-6 text-klo-gold" />
            Testimonials
          </h2>
          <p className="text-sm text-klo-muted mt-1">
            Approve ratings, add quotes, and manage what shows on the marketing site.
          </p>
        </div>
        <button
          onClick={() => void fetchTestimonials()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-klo-text transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 border border-white/5">
          <p className="text-xs uppercase tracking-wide text-klo-muted">Pending approval</p>
          <p className="text-2xl font-bold text-klo-text mt-1">{pendingCount}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/5">
          <p className="text-xs uppercase tracking-wide text-klo-muted">Approved total</p>
          <p className="text-2xl font-bold text-klo-text mt-1">{approvedCount}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/5">
          <p className="text-xs uppercase tracking-wide text-klo-muted">Live on site</p>
          <p className="text-2xl font-bold text-klo-text mt-1">{displayCount}</p>
          <p className="text-[11px] text-klo-muted mt-0.5">Approved + has quote</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        {(["all", "pending", "approved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              filter === f
                ? "bg-klo-gold/20 text-klo-gold border border-klo-gold/30"
                : "text-klo-muted hover:text-klo-text hover:bg-white/5 border border-transparent"
            }`}
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 text-[11px] bg-klo-gold/30 text-klo-gold rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center gap-2 text-sm text-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && testimonials.length === 0 && (
        <div className="flex items-center justify-center py-12 text-klo-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center">
          <MessageSquareQuote className="w-10 h-10 text-klo-muted/40 mx-auto mb-3" />
          <p className="text-klo-muted">
            {filter === "pending"
              ? "No testimonials awaiting approval."
              : filter === "approved"
                ? "No approved testimonials yet."
                : "No testimonials collected yet."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border p-4 transition-colors ${
              t.approved
                ? "border-klo-gold/20 bg-klo-gold/[0.03]"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center flex-wrap gap-2">
                  <StarRow rating={t.rating} />
                  <span className="text-xs text-klo-muted">·</span>
                  <span className="text-sm text-klo-text font-medium truncate">
                    {t.organizer_name || t.email}
                  </span>
                  {t.organizer_name && (
                    <span className="text-xs text-klo-muted truncate">{t.email}</span>
                  )}
                  {t.approved ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-klo-gold bg-klo-gold/15 border border-klo-gold/30 rounded-full px-2 py-0.5">
                      <Check className="w-3 h-3" />
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-klo-muted bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                      Pending
                    </span>
                  )}
                </div>
                {t.quote ? (
                  <p className="text-sm text-klo-text/90 leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                ) : (
                  <p className="text-sm text-klo-muted/70 italic">
                    No quote yet — click Edit to add one.
                  </p>
                )}
                <p className="text-[11px] text-klo-muted">
                  {new Date(t.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => void toggleApproved(t)}
                  disabled={savingId === t.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    t.approved
                      ? "bg-white/5 text-klo-muted hover:bg-white/10 border border-white/10"
                      : "bg-klo-gold/20 text-klo-gold hover:bg-klo-gold/30 border border-klo-gold/30"
                  } disabled:opacity-50`}
                  title={t.approved ? "Unapprove" : "Approve"}
                >
                  {savingId === t.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : t.approved ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      Unapprove
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEditing(t)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 text-klo-text hover:bg-white/10 border border-white/10 transition-colors"
                  title="Edit quote"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => void deleteTestimonial(t.id)}
                  disabled={deletingId === t.id}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-300 hover:bg-red-500/15 border border-red-500/20 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === t.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <TestimonialEditModal
          testimonial={editing}
          saving={savingId === editing.id}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </motion.div>
  );
}

function TestimonialEditModal({
  testimonial,
  saving,
  onSave,
  onClose,
}: {
  testimonial: Testimonial;
  saving: boolean;
  onSave: (patch: {
    quote: string | null;
    organizer_name: string | null;
    rating: number;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [quote, setQuote] = useState(testimonial.quote ?? "");
  const [organizerName, setOrganizerName] = useState(testimonial.organizer_name ?? "");
  const [rating, setRating] = useState(testimonial.rating);

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit testimonial">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-klo-muted mb-1.5 block">
            Email (read-only)
          </label>
          <div className="text-sm text-klo-text bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
            {testimonial.email}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-klo-muted mb-1.5 block">
            Organizer name
          </label>
          <input
            type="text"
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            placeholder="e.g. Leadership Summit 2026"
            className="w-full bg-[#0D1117] border border-[#21262D] rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50"
            maxLength={200}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-klo-muted mb-1.5 block">
            Rating
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`${n} stars`}
              >
                <Star
                  className={`w-6 h-6 ${
                    n <= rating ? "fill-klo-gold text-klo-gold" : "text-klo-muted/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-klo-muted mb-1.5 block">
            Quote
          </label>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={5}
            placeholder="Keith&rsquo;s session transformed how our team thinks about leadership under pressure..."
            className="w-full bg-[#0D1117] border border-[#21262D] rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50 resize-y"
            maxLength={2000}
          />
          <p className="text-[11px] text-klo-muted mt-1">
            {quote.length}/2000 · Only approved testimonials with a non-empty quote show on the public site.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              void onSave({
                quote: quote.trim() ? quote.trim() : null,
                organizer_name: organizerName.trim() ? organizerName.trim() : null,
                rating,
              })
            }
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-klo-gold/20 text-klo-gold hover:bg-klo-gold/30 border border-klo-gold/30 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
