"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Loader2, UserRound } from "lucide-react";

interface GuestSignInCardProps {
  onSignIn: (params: { display_name: string; access_code: string }) => Promise<{ success: boolean; error?: string }>;
  eventTitle?: string;
}

export default function GuestSignInCard({ onSignIn, eventTitle }: GuestSignInCardProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setSubmitting(true);
    setError(null);

    const result = await onSignIn({
      display_name: name.trim(),
      access_code: code.trim().toUpperCase(),
    });

    if (!result.success) {
      setError(result.error || "Invalid access code");
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass rounded-2xl p-6 sm:p-8 border border-white/10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#2764FF]/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound size={28} className="text-[#2764FF]" />
          </div>
          <h2 className="font-display text-xl font-bold text-klo-text mb-2">
            Join the Event
          </h2>
          {eventTitle && (
            <p className="text-sm text-klo-gold font-medium mb-1">{eventTitle}</p>
          )}
          <p className="text-sm text-klo-muted">
            Enter your name and the access code to participate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-klo-muted mb-1.5">Your Name</label>
            <div className="relative">
              <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-klo-muted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-[#2764FF]/50"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-klo-muted mb-1.5">Access Code</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-klo-muted" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. NEWLIFE26"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-[#2764FF]/50"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !code.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Joining...
              </>
            ) : (
              "Join Event"
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
