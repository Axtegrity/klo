"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { haptics } from "@/lib/haptics";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        haptics.error();
        setIsLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please sign in manually.");
        haptics.error();
        setIsLoading(false);
        return;
      }

      if (result?.url) {
        haptics.success();
        router.push(result.url);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      haptics.error();
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Branding */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="font-display text-5xl font-bold text-[#C8A84E] tracking-wide"
            >
              KLO
            </motion.h1>
          </Link>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-3 text-klo-text text-lg"
          >
            Create Account
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-1 text-klo-muted text-sm"
          >
            Join the KLO platform for exclusive access
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-[#161B22] border border-[#21262D] rounded-2xl p-8"
        >
          {/* Error display */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-3">
            <input
              type="text"
              placeholder="Full name (optional)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] text-klo-text py-3 px-4 rounded-xl focus:outline-none focus:border-[#C8A84E] transition-colors placeholder:text-klo-muted/50"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0D1117] border border-[#30363D] text-klo-text py-3 px-4 rounded-xl focus:outline-none focus:border-[#C8A84E] transition-colors placeholder:text-klo-muted/50"
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-[#0D1117] border border-[#30363D] text-klo-text py-3 px-4 rounded-xl focus:outline-none focus:border-[#C8A84E] transition-colors placeholder:text-klo-muted/50"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-[#0D1117] border border-[#30363D] text-klo-text py-3 px-4 rounded-xl focus:outline-none focus:border-[#C8A84E] transition-colors placeholder:text-klo-muted/50"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#C8A84E] text-[#0D1117] py-3 rounded-xl hover:bg-[#d4b85e] transition-all duration-200 cursor-pointer font-semibold disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-xs text-klo-muted text-center leading-snug">
            By continuing, you agree to the{" "}
            <Link href="/terms" className="text-[#2764FF] hover:underline">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="text-[#2764FF] hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-klo-muted">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-[#2764FF] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
