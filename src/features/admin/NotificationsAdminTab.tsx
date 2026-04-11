"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Bell,
  Users,
  User,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
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

interface PushSub {
  id: string;
  user_id: string;
  platform: string;
  user_agent: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface UniqueUser {
  id: string;
  name: string | null;
  email: string | null;
  platforms: string[];
}

type SendTarget = "broadcast" | "user";

export default function NotificationsAdminTab() {
  // Compose form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState<SendTarget>("broadcast");
  const [targetUserId, setTargetUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    ok: boolean;
    sent?: number;
    failed?: number;
    message?: string;
  } | null>(null);

  // Subscribers list
  const [subscribers, setSubscribers] = useState<PushSub[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<UniqueUser[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [subStats, setSubStats] = useState({ total: 0, web: 0, ios: 0, android: 0 });

  const fetchSubscribers = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch("/api/push/subscribers");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
        setUniqueUsers(data.users || []);
        setSubStats(data.stats || { total: 0, web: 0, ios: 0, android: 0 });
      }
    } catch {
      // Silently fail
    }
    setLoadingSubs(false);
  }, []);

  // Defer to a microtask so the loading-flag setState inside fetchSubscribers
  // doesn't run synchronously in the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    Promise.resolve().then(fetchSubscribers);
  }, [fetchSubscribers]);

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

      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, sent: data.sent, failed: data.failed });
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

  const platformIcon = (platform: string) => {
    switch (platform) {
      case "web":
        return <Monitor className="w-4 h-4 text-blue-400" />;
      case "ios":
        return <Smartphone className="w-4 h-4 text-klo-gold" />;
      case "android":
        return <Smartphone className="w-4 h-4 text-green-400" />;
      default:
        return <Globe className="w-4 h-4 text-klo-muted" />;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Subscriber stats */}
      <motion.div
        variants={fadeUp}
        custom={0}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Subscribers", value: subStats.total, icon: Users, color: "text-klo-gold" },
          { label: "Web Push", value: subStats.web, icon: Monitor, color: "text-blue-400" },
          { label: "iOS", value: subStats.ios, icon: Smartphone, color: "text-klo-gold" },
          { label: "Android", value: subStats.android, icon: Smartphone, color: "text-green-400" },
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
              <h3 className="text-lg font-semibold text-klo-text">Send Push Notification</h3>
              <p className="text-sm text-klo-muted">Compose and send to all subscribers or a specific user</p>
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
                Broadcast to All
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

            {/* User dropdown (when targeting specific user) */}
            {target === "user" && (
              <div>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">
                    {uniqueUsers.length === 0
                      ? "No subscribed users yet"
                      : "Select a user..."}
                  </option>
                  {uniqueUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email ?? u.id.slice(0, 8)}
                      {u.email && u.name ? ` · ${u.email}` : ""}
                      {` · ${u.platforms.join(", ")}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-klo-muted mt-1">
                  Only users with an active push subscription appear here.
                </p>
              </div>
            )}

            {/* Title */}
            <input
              type="text"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClasses}
            />

            {/* Body */}
            <textarea
              placeholder="Notification body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className={`${inputClasses} resize-none`}
            />

            {/* URL (optional) */}
            <input
              type="text"
              placeholder="Link URL (optional — e.g., /vault, /assessments)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClasses}
            />

            {/* Send result */}
            {sendResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                  sendResult.ok
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {sendResult.ok ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Sent to {sendResult.sent} device{sendResult.sent !== 1 ? "s" : ""}
                    {sendResult.failed ? ` (${sendResult.failed} failed)` : ""}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    {sendResult.message}
                  </>
                )}
              </div>
            )}

            {/* Send button */}
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

      {/* Subscribers list */}
      <motion.div variants={fadeUp} custom={2}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-klo-text">
            Active Subscribers ({subStats.total})
          </h3>
          <button
            onClick={fetchSubscribers}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-klo-dark border border-white/10 text-klo-muted hover:text-klo-text transition-colors text-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSubs ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-klo-muted font-medium">User</th>
                  <th className="text-left px-6 py-4 text-klo-muted font-medium">Platform</th>
                  <th className="text-left px-6 py-4 text-klo-muted font-medium hidden md:table-cell">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {loadingSubs ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-klo-muted">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-klo-muted">
                      No push subscribers yet
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-klo-text font-medium">
                          {sub.user_name || "Unknown"}
                        </p>
                        <p className="text-xs text-klo-muted">{sub.user_email || sub.user_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5">
                          {platformIcon(sub.platform)}
                          <span className="text-klo-muted capitalize">{sub.platform}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-klo-muted hidden md:table-cell">
                        {new Date(sub.created_at).toLocaleDateString()}
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
