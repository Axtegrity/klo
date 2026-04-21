"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Bell,
  Users,
  User,
  Smartphone,
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

type Channel = "push" | "email" | "both" | "none";

interface AudienceUser {
  id: string;
  name: string | null;
  email: string | null;
  platforms: string[];
  channel: Channel;
  created_at: string;
}

interface AudienceStats {
  total: number;
  push: number;
  email: number;
  web: number;
  ios: number;
  android: number;
}

type SendTarget = "broadcast" | "user";

interface SendResult {
  ok: boolean;
  message?: string;
  total_targets?: number;
  push_sent?: number;
  push_failed?: number;
  email_sent?: number;
  email_failed?: number;
}

export default function NotificationsAdminTab() {
  // Compose form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState<SendTarget>("broadcast");
  const [targetUserId, setTargetUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  // Audience list
  const [users, setUsers] = useState<AudienceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AudienceStats>({
    total: 0,
    push: 0,
    email: 0,
    web: 0,
    ios: 0,
    android: 0,
  });
  const [filter, setFilter] = useState("");

  const fetchAudience = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notify/audience");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(
          data.stats || { total: 0, push: 0, email: 0, web: 0, ios: 0, android: 0 }
        );
      }
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchAudience);
  }, [fetchAudience]);

  const filteredUsers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
    );
  }, [users, filter]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setSendResult(null);

    try {
      const payload: Record<string, unknown> = { title, body };
      if (url.trim()) payload.url = url.trim();
      if (target === "user" && targetUserId.trim()) {
        payload.userId = targetUserId.trim();
      }

      const res = await fetch("/api/notify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult({
          ok: true,
          total_targets: data.total_targets,
          push_sent: data.push_sent,
          push_failed: data.push_failed,
          email_sent: data.email_sent,
          email_failed: data.email_failed,
        });
        setTitle("");
        setBody("");
        setUrl("");
        setTargetUserId("");
      } else {
        setSendResult({ ok: false, message: data.error || "Failed to send" });
      }
    } catch {
      setSendResult({ ok: false, message: "Network error" });
    }
    setSending(false);
  };

  const inputClasses =
    "w-full bg-klo-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-klo-gold/50 transition-colors";

  const channelBadge = (channel: Channel, platforms: string[]) => {
    const platformLabel = platforms.length > 0 ? ` · ${platforms.join(", ")}` : "";
    switch (channel) {
      case "both":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-klo-gold/15 text-klo-gold border border-klo-gold/20">
            <Bell className="w-3 h-3" />
            push + email{platformLabel}
          </span>
        );
      case "push":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
            <Bell className="w-3 h-3" />
            push{platformLabel}
          </span>
        );
      case "email":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-white/5 text-klo-muted border border-white/10">
            <Mail className="w-3 h-3" />
            email
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3 h-3" />
            no channel
          </span>
        );
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Audience stats */}
      <motion.div
        variants={fadeUp}
        custom={0}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: "Registered Users", value: stats.total, icon: Users, color: "text-klo-gold" },
          { label: "Reachable via Push", value: stats.push, icon: Bell, color: "text-blue-400" },
          { label: "Reachable via Email", value: stats.email, icon: Mail, color: "text-klo-gold" },
          { label: "Native (iOS+Android)", value: stats.ios + stats.android, icon: Smartphone, color: "text-green-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-klo-muted">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-klo-text font-display">{stat.value}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Compose notification */}
      <motion.div variants={fadeUp} custom={1}>
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-klo-gold/10">
              <Bell className="w-5 h-5 text-klo-gold" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-klo-text">Send Notification</h3>
              <p className="text-sm text-klo-muted">
                Push where a device is subscribed, email as fallback — everyone gets reached.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Target selector */}
            <div className="flex gap-3">
              <button
                onClick={() => setTarget("broadcast")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  target === "broadcast"
                    ? "bg-klo-gold/20 text-klo-gold border border-klo-gold/30"
                    : "bg-klo-dark border border-white/10 text-klo-muted hover:text-klo-text"
                }`}
              >
                <Users className="w-4 h-4" />
                All Registered Users ({stats.total})
              </button>
              <button
                onClick={() => setTarget("user")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  target === "user"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-klo-dark border border-white/10 text-klo-muted hover:text-klo-text"
                }`}
              >
                <User className="w-4 h-4" />
                Specific User
              </button>
            </div>

            {/* User dropdown */}
            {target === "user" && (
              <div>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">
                    {users.length === 0 ? "No registered users yet" : "Select a user..."}
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email ?? u.id.slice(0, 8)}
                      {u.email && u.name ? ` · ${u.email}` : ""}
                      {" · "}
                      {u.channel === "both"
                        ? "push + email"
                        : u.channel === "push"
                          ? "push"
                          : u.channel === "email"
                            ? "email"
                            : "no channel"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-klo-muted mt-1">
                  Any registered user — push where subscribed, email otherwise.
                </p>
              </div>
            )}

            <input
              type="text"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClasses}
            />

            <textarea
              placeholder="Notification body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className={`${inputClasses} resize-none`}
            />

            <input
              type="text"
              placeholder="Link URL (optional — e.g., /vault, /assessments)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClasses}
            />

            {sendResult && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  sendResult.ok
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {sendResult.ok ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <div>
                        Delivered to {(sendResult.push_sent ?? 0) + (sendResult.email_sent ?? 0)} of{" "}
                        {sendResult.total_targets ?? 0} users
                      </div>
                      <div className="text-xs text-green-300/80">
                        Push: {sendResult.push_sent ?? 0} sent
                        {sendResult.push_failed ? ` · ${sendResult.push_failed} failed` : ""}
                        {" · "}
                        Email: {sendResult.email_sent ?? 0} sent
                        {sendResult.email_failed ? ` · ${sendResult.email_failed} failed` : ""}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {sendResult.message}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-klo-gold text-klo-dark font-semibold text-sm hover:bg-klo-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Audience list */}
      <motion.div variants={fadeUp} custom={2}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-lg font-semibold text-klo-text">
            Audience ({filteredUsers.length}/{stats.total})
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-klo-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-klo-dark border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-klo-gold/50 transition-colors w-56"
              />
            </div>
            <button
              onClick={fetchAudience}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-klo-dark border border-white/10 text-klo-muted hover:text-klo-text transition-colors text-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-klo-muted font-medium">User</th>
                  <th className="text-left px-6 py-4 text-klo-muted font-medium">Channel</th>
                  <th className="text-left px-6 py-4 text-klo-muted font-medium hidden md:table-cell">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-klo-muted">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-klo-muted">
                      {users.length === 0 ? "No registered users yet" : "No matches"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-klo-text font-medium">
                          {u.name || "Unnamed"}
                        </p>
                        <p className="text-xs text-klo-muted">{u.email || u.id}</p>
                      </td>
                      <td className="px-6 py-4">{channelBadge(u.channel, u.platforms)}</td>
                      <td className="px-6 py-4 text-klo-muted hidden md:table-cell">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
