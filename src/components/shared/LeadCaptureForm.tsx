"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface LeadData {
  name: string;
  email: string;
  phone: string;
  organization: string;
}

interface LeadCaptureFormProps {
  onSubmit: (data: LeadData) => Promise<void>;
  title: string;
  subtitle: string;
  submitLabel: string;
  prefill?: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
  };
  isLoading?: boolean;
}

interface FieldErrors {
  name?: string;
  email?: string;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function LeadCaptureForm({
  onSubmit,
  title,
  subtitle,
  submitLabel,
  prefill,
  isLoading = false,
}: LeadCaptureFormProps) {
  const { data: session } = useSession();

  const [name, setName] = useState(prefill?.name ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [organization, setOrganization] = useState(prefill?.organization ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from session once available — session may arrive after mount.
  // Intentionally omits name/email from deps: re-running on every keystroke
  // would fight user edits. We only want to fill empty fields on session arrival.
  useEffect(() => {
    if (session?.user) {
      if (!name && session.user.name) setName(session.user.name);
      if (!email && session.user.email) setEmail(session.user.email);
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill organization from profile API if signed in and org not already set.
  // Intentionally omits organization from deps: adding it would re-trigger the
  // fetch on every keystroke in the org field, which is wrong.
  useEffect(() => {
    if (!session?.user || organization) return;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.organization_name && !organization) {
          setOrganization(data.organization_name);
        }
      })
      .catch(() => {});
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Full name is required.";
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-klo-text">
          {title}
        </h2>
        <p className="text-klo-muted text-base leading-relaxed">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="lcf-name"
            className="block text-sm font-medium text-klo-text"
          >
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="lcf-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            disabled={busy}
            placeholder="Your full name"
            className={`w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#0D1117] border text-sm text-klo-text placeholder:text-klo-muted focus:outline-none transition-colors disabled:opacity-50 ${
              errors.name
                ? "border-red-500/60 focus:border-red-500"
                : "border-white/10 focus:border-[#C8A84E]/60"
            }`}
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="lcf-email"
            className="block text-sm font-medium text-klo-text"
          >
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="lcf-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            disabled={busy}
            placeholder="you@example.com"
            className={`w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#0D1117] border text-sm text-klo-text placeholder:text-klo-muted focus:outline-none transition-colors disabled:opacity-50 ${
              errors.email
                ? "border-red-500/60 focus:border-red-500"
                : "border-white/10 focus:border-[#C8A84E]/60"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone (optional) */}
        <div className="space-y-1.5">
          <label
            htmlFor="lcf-phone"
            className="block text-sm font-medium text-klo-text"
          >
            Phone{" "}
            <span className="text-klo-muted font-normal">(optional)</span>
          </label>
          <input
            id="lcf-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={busy}
            placeholder="+1 (555) 000-0000"
            className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#0D1117] border border-white/10 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-[#C8A84E]/60 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Organization (optional) */}
        <div className="space-y-1.5">
          <label
            htmlFor="lcf-org"
            className="block text-sm font-medium text-klo-text"
          >
            Organization{" "}
            <span className="text-klo-muted font-normal">(optional)</span>
          </label>
          <input
            id="lcf-org"
            type="text"
            autoComplete="organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            disabled={busy}
            placeholder="Your church, company, or organization"
            className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#0D1117] border border-white/10 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-[#C8A84E]/60 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[52px] mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#C8A84E] hover:bg-[#D4B45E] text-black font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>
    </motion.div>
  );
}
