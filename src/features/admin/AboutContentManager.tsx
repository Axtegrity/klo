"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ServiceForm {
  title: string;
  description: string;
  badge: string;
}

interface AboutForm {
  hero_badge: string;
  hero_heading: string;
  hero_tagline: string;
  bio: string; // joined with \n\n on load; split on save
  services: ServiceForm[];
}

const DEFAULT_FORM: AboutForm = {
  hero_badge: "",
  hero_heading: "",
  hero_tagline: "",
  bio: "",
  services: [
    { title: "", description: "", badge: "" },
    { title: "", description: "", badge: "" },
    { title: "", description: "", badge: "" },
    { title: "", description: "", badge: "" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function AboutContentManager() {
  const { toast } = useToast();
  const [form, setForm] = useState<AboutForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ---- Load current values on mount ----
  useEffect(() => {
    fetch("/api/about")
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return;
        const paragraphs: string[] = Array.isArray(data.bio_paragraphs)
          ? (data.bio_paragraphs as string[])
          : [];
        const rawServices = Array.isArray(data.services)
          ? (data.services as { title?: string; description?: string; badge?: string }[])
          : [];

        // Ensure we always have 4 service slots
        const services: ServiceForm[] = [0, 1, 2, 3].map((i) => ({
          title: rawServices[i]?.title ?? "",
          description: rawServices[i]?.description ?? "",
          badge: rawServices[i]?.badge ?? "",
        }));

        setForm({
          hero_badge: data.hero_badge ?? "",
          hero_heading: data.hero_heading ?? "",
          hero_tagline: data.hero_tagline ?? "",
          bio: paragraphs.join("\n\n"),
          services,
        });
      })
      .catch(() => {
        // If the table doesn't exist yet (pre-migration), stay on defaults
      })
      .finally(() => setLoading(false));
  }, []);

  // ---- Field helpers ----
  const setTopLevel = (key: keyof Omit<AboutForm, "services">, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setServiceField = (
    index: number,
    key: keyof ServiceForm,
    value: string
  ) => {
    setForm((prev) => {
      const services = [...prev.services];
      services[index] = { ...services[index], [key]: value };
      return { ...prev, services };
    });
  };

  // ---- Save ----
  const handleSave = async () => {
    setSaving(true);
    try {
      const bio_paragraphs = form.bio
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero_badge: form.hero_badge,
          hero_heading: form.hero_heading,
          hero_tagline: form.hero_tagline,
          bio_paragraphs,
          services: form.services,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Save failed");
      }

      toast("success", "Saved — changes are live.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  // ---- Render ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 text-klo-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* ── Hero fields ── */}
      <section>
        <h3 className="text-sm font-semibold text-klo-text mb-4 uppercase tracking-wider">
          Hero Section
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-klo-muted mb-1.5">
              Hero Badge
            </label>
            <input
              type="text"
              value={form.hero_badge}
              onChange={(e) => setTopLevel("hero_badge", e.target.value)}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-[#2764FF]/50"
              placeholder="e.g. Technology Innovator · Speaker · Pastor"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-klo-muted mb-1.5">
              Hero Heading
            </label>
            <input
              type="text"
              value={form.hero_heading}
              onChange={(e) => setTopLevel("hero_heading", e.target.value)}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-[#2764FF]/50"
              placeholder="Keith L. Odom"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-klo-muted mb-1.5">
              Hero Tagline
            </label>
            <textarea
              value={form.hero_tagline}
              onChange={(e) => setTopLevel("hero_tagline", e.target.value)}
              maxLength={600}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-[#2764FF]/50 resize-none"
              placeholder="Bridging faith, technology, and leadership..."
            />
          </div>
        </div>
      </section>

      {/* ── Bio ── */}
      <section>
        <h3 className="text-sm font-semibold text-klo-text mb-1 uppercase tracking-wider">
          Bio
        </h3>
        <p className="text-xs text-klo-muted mb-4">
          Separate paragraphs with a blank line (double Enter). Each block becomes its own paragraph on the page.
        </p>
        <textarea
          value={form.bio}
          onChange={(e) => setTopLevel("bio", e.target.value)}
          rows={16}
          className="w-full px-4 py-3 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-[#2764FF]/50 resize-y font-mono leading-relaxed"
          placeholder="First paragraph...&#10;&#10;Second paragraph..."
        />
      </section>

      {/* ── Services ── */}
      <section>
        <h3 className="text-sm font-semibold text-klo-text mb-1 uppercase tracking-wider">
          Services
        </h3>
        <p className="text-xs text-klo-muted mb-4">
          Service card images are fixed (/images/keith/a–d.jpg). Only text is editable here.
        </p>
        <div className="space-y-6">
          {form.services.map((service, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-white/5 bg-klo-dark/30 space-y-3"
            >
              <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider">
                Service {i + 1}
              </p>
              <div>
                <label className="block text-xs font-medium text-klo-muted mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={service.title}
                  onChange={(e) => setServiceField(i, "title", e.target.value)}
                  maxLength={120}
                  className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-[#2764FF]/50"
                  placeholder="e.g. IT Consulting"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-klo-muted mb-1.5">
                  Description
                </label>
                <textarea
                  value={service.description}
                  onChange={(e) => setServiceField(i, "description", e.target.value)}
                  maxLength={600}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-[#2764FF]/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-klo-muted mb-1.5">
                  Badge
                </label>
                <input
                  type="text"
                  value={service.badge}
                  onChange={(e) => setServiceField(i, "badge", e.target.value)}
                  maxLength={60}
                  className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-[#2764FF]/50"
                  placeholder="e.g. Strategy"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Save ── */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2764FF] text-white text-sm font-semibold hover:bg-[#2764FF]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
