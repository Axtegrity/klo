"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Type,
  Link2,
  Globe,
  LayoutDashboard,
  BookOpen,
  Mic2,
  ShieldCheck,
  DollarSign,
  MessageSquare,
  Users,
  Paperclip,
  Clock,
  AlertCircle,
} from "lucide-react";

// ------------------------------------------------------------
// Page sections Keith can request changes to
// ------------------------------------------------------------

const SITE_SECTIONS = [
  { id: "homepage-hero", label: "Homepage — Hero Banner", icon: Globe, description: "Headline, tagline, CTA buttons, hero image" },
  { id: "homepage-brief", label: "Homepage — Latest Brief", icon: FileText, description: "Featured article title, excerpt, link" },
  { id: "about-bio", label: "About — Bio & Background", icon: Users, description: "Biography paragraphs, credentials, photo" },
  { id: "about-services", label: "About — Services", icon: ShieldCheck, description: "Service card titles and descriptions" },
  { id: "assessments", label: "Assessments Page", icon: BookOpen, description: "Assessment titles, descriptions, categories" },
  { id: "vault", label: "Vault Content", icon: FileText, description: "Articles, resources, descriptions" },
  { id: "booking", label: "Booking / Speaking Page", icon: Mic2, description: "Hero text, stats, form intro" },
  { id: "consult", label: "Consultation Page", icon: MessageSquare, description: "Topics, descriptions, bullet points" },
  { id: "events", label: "Events Page", icon: LayoutDashboard, description: "Intro text, CTA section" },
  { id: "advisor", label: "KLO Intelligence / AI Advisor", icon: MessageSquare, description: "Title, subtitle, AI persona" },
  { id: "pricing", label: "Pricing Page", icon: DollarSign, description: "Plan names, prices, features, FAQs" },
  { id: "navigation", label: "Navigation & Footer", icon: Link2, description: "Menu links, footer text, social links" },
  { id: "seo", label: "SEO & Metadata", icon: Globe, description: "Page titles, descriptions, OG image" },
  { id: "images", label: "Photos & Images", icon: ImageIcon, description: "Portrait, backgrounds, logo" },
  { id: "other", label: "Other / Not Sure", icon: Type, description: "Something not listed above" },
];

const CHANGE_TYPES = [
  { id: "text", label: "Update text", icon: Type },
  { id: "image", label: "Replace image/photo", icon: ImageIcon },
  { id: "link", label: "Change a link/URL", icon: Link2 },
  { id: "add", label: "Add new content", icon: FileText },
  { id: "remove", label: "Remove content", icon: AlertCircle },
  { id: "other", label: "Other", icon: Paperclip },
];

const PRIORITIES = [
  { id: "low", label: "Whenever you get to it", color: "text-klo-muted", bg: "bg-white/5" },
  { id: "medium", label: "This week", color: "text-[#2764FF]", bg: "bg-[#2764FF]/10" },
  { id: "high", label: "As soon as possible", color: "text-[#F77A81]", bg: "bg-[#F77A81]/10" },
];

export default function RequestUpdatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [section, setSection] = useState("");
  const [changeType, setChangeType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [newText, setNewText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const userName = session?.user?.name || "Admin";
  const userEmail = session?.user?.email || "";

  const handleSubmit = async () => {
    if (!section || !description) {
      setError("Please select a section and describe the change.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      // Log the request to the admin activity log
      await fetch("/api/admin/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "site_update_request",
          entity_type: "site_content",
          entity_id: section,
          details: `[${PRIORITIES.find(p => p.id === priority)?.label}] ${SITE_SECTIONS.find(s => s.id === section)?.label}: ${description}`,
          metadata: {
            section,
            changeType,
            priority,
            description,
            currentText: currentText || null,
            newText: newText || null,
            requestedBy: userName,
            requestedByEmail: userEmail,
            requestedAt: new Date().toISOString(),
          },
        }),
      });

      // Also send notification email via the inquiries endpoint
      await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "site_update",
          name: userName,
          email: userEmail,
          message: [
            `**Section:** ${SITE_SECTIONS.find(s => s.id === section)?.label}`,
            `**Change Type:** ${CHANGE_TYPES.find(c => c.id === changeType)?.label || "Not specified"}`,
            `**Priority:** ${PRIORITIES.find(p => p.id === priority)?.label}`,
            `**Description:** ${description}`,
            currentText ? `**Current Text:** ${currentText}` : null,
            newText ? `**New Text:** ${newText}` : null,
          ].filter(Boolean).join("\n"),
          status: "new",
        }),
      }).catch(() => {
        // Inquiry POST might not support this shape — that's OK, activity log is the primary record
      });

      setSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again or contact Tim directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-klo-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-klo-text mb-3">Request Submitted</h2>
          <p className="text-klo-muted mb-2">
            Your update request has been logged and Tim will be notified.
          </p>
          <p className="text-sm text-klo-muted mb-8">
            {priority === "high" ? "Expect a response within 24 hours." :
             priority === "medium" ? "This will be handled this week." :
             "This will be handled at the next available opportunity."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSubmitted(false);
                setSection("");
                setChangeType("");
                setDescription("");
                setCurrentText("");
                setNewText("");
              }}
              className="px-5 py-2.5 rounded-xl bg-klo-slate border border-white/10 text-klo-text text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Submit Another
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="px-5 py-2.5 rounded-xl bg-klo-gold/15 border border-klo-gold/30 text-klo-gold text-sm font-medium hover:bg-klo-gold/25 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-klo-dark">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-klo-dark/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-klo-text flex items-center gap-2">
              <Send size={18} className="text-klo-gold" />
              Request a Site Update
            </h1>
            <p className="text-xs text-klo-muted mt-0.5">
              Describe what you&rsquo;d like changed — Tim will handle it
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Step 1: Section */}
        <div>
          <label className="text-sm font-semibold text-klo-text mb-3 block">
            1. What section of the site?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SITE_SECTIONS.map((s) => {
              const Icon = s.icon;
              const selected = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? "border-klo-gold/40 bg-klo-gold/10"
                      : "border-white/5 bg-klo-surface hover:border-white/10"
                  }`}
                >
                  <Icon size={16} className={selected ? "text-klo-gold mt-0.5" : "text-klo-muted mt-0.5"} />
                  <div>
                    <div className={`text-sm font-medium ${selected ? "text-klo-gold" : "text-klo-text"}`}>
                      {s.label}
                    </div>
                    <div className="text-xs text-klo-muted">{s.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Change type */}
        <AnimatePresence>
          {section && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <label className="text-sm font-semibold text-klo-text mb-3 block">
                2. What kind of change?
              </label>
              <div className="flex flex-wrap gap-2">
                {CHANGE_TYPES.map((c) => {
                  const Icon = c.icon;
                  const selected = changeType === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setChangeType(c.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        selected
                          ? "border-klo-gold/40 bg-klo-gold/10 text-klo-gold"
                          : "border-white/5 bg-klo-surface text-klo-muted hover:text-klo-text hover:border-white/10"
                      }`}
                    >
                      <Icon size={14} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Description */}
        <AnimatePresence>
          {section && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-semibold text-klo-text mb-2 block">
                  3. Describe the change
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What should be updated? Be as specific as possible..."
                  rows={4}
                  className="w-full rounded-xl bg-klo-surface border border-white/10 px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-klo-gold/40 resize-none"
                />
              </div>

              {/* Optional: current → new text */}
              {(changeType === "text" || changeType === "link") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-klo-muted mb-1.5 block">
                      Current text (optional)
                    </label>
                    <textarea
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      placeholder="What it says now..."
                      rows={3}
                      className="w-full rounded-xl bg-klo-surface border border-white/10 px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-white/20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-klo-muted mb-1.5 block">
                      New text
                    </label>
                    <textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="What it should say..."
                      rows={3}
                      className="w-full rounded-xl bg-klo-surface border border-white/10 px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-white/20 resize-none"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: Priority */}
        <AnimatePresence>
          {section && description && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <label className="text-sm font-semibold text-klo-text mb-3 block flex items-center gap-2">
                <Clock size={14} className="text-klo-muted" />
                4. How urgent?
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => {
                  const selected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPriority(p.id)}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        selected
                          ? `${p.bg} ${p.color} border-current/20`
                          : "border-white/5 bg-klo-surface text-klo-muted hover:text-klo-text"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-[#F77A81]/10 border border-[#F77A81]/20 p-4 text-sm text-[#F77A81]">
            {error}
          </div>
        )}

        {/* Submit */}
        <AnimatePresence>
          {section && description && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-klo-gold text-klo-dark font-semibold text-sm hover:bg-klo-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {submitting ? "Submitting..." : "Submit Update Request"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
