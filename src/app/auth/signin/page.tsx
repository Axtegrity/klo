"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-klo-muted">Loading...</div></div>}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorParam ?? "");
  const [magicSent, setMagicSent] = useState(false);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError("Invalid email or password. Use password: demo123");
      setLoading(false);
    } else if (result?.url) {
      window.location.href = result.url;
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — would integrate with Resend in production
    setMagicSent(true);
  };

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Error starting OAuth sign-in.",
    OAuthCallback: "Error during OAuth callback.",
    OAuthCreateAccount: "Could not create OAuth account.",
    Callback: "Authentication callback error.",
    CredentialsSignin: "Invalid email or password. Use password: demo123",
    Default: "An unexpected error occurred.",
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
            Welcome back
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-1 text-klo-muted text-sm"
          >
            Sign in to access your premium experience
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
          {(error || errorParam) && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error || errorMessages[errorParam ?? ""] || errorMessages.Default}
            </div>
          )}

          {/* Credentials form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-klo-muted mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-klo-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-klo-navy border border-klo-slate text-klo-text placeholder-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50 focus:ring-1 focus:ring-[#2764FF]/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-klo-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-klo-muted" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-klo-navy border border-klo-slate text-klo-text placeholder-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50 focus:ring-1 focus:ring-[#2764FF]/30 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold py-3 rounded-full hover:brightness-110 active:brightness-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-klo-slate" />
            <span className="text-klo-muted text-xs uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-klo-slate" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 border border-klo-slate text-klo-text py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Magic link section */}
          <div className="mt-6 pt-6 border-t border-klo-slate">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-[#2764FF]" />
              <span className="text-sm text-klo-muted">Passwordless sign-in</span>
            </div>
            {magicSent ? (
              <p className="text-sm text-emerald-400">
                Magic link sent! Check your inbox.
              </p>
            ) : (
              <form onSubmit={handleMagicLink} className="flex gap-2">
                <input
                  type="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="Email for magic link"
                  required
                  className="flex-1 px-4 py-2.5 rounded-lg bg-klo-navy border border-klo-slate text-klo-text text-sm placeholder-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg border border-[#2764FF] text-[#2764FF] text-sm font-medium hover:bg-[#2764FF]/10 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Send Link
                </button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-6 text-center space-y-3"
        >
          <p className="text-sm text-klo-muted">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-[#2764FF] hover:underline">
              Create one
            </Link>
          </p>
          <p className="text-xs text-klo-muted/60">
            Demo mode: use any email with password <code className="text-[#2764FF]/70">demo123</code>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
