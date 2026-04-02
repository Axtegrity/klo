"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  DollarSign,
  BotMessageSquare,
  ClipboardCheck,
  LayoutDashboard,
  Lock,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  AlertTriangle,
  BarChart3,
  Vote,
  Inbox,
  BookOpen,
  Send,
  Bell,
  ScrollText,
} from "lucide-react";
import Modal from "@/components/shared/Modal";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type {
  AdminDashboardStats,
  AdminActivityData,
  AdminUser,
  AdminAssessmentResult,
} from "@/types";
import { ASSESSMENTS } from "@/lib/constants";
import ConferenceAdminTab from "@/features/conference/admin/ConferenceAdminTab";
import EventsAdminTab from "@/features/admin/EventsAdminTab";
import InquiriesAdminTab from "@/features/admin/InquiriesAdminTab";
import PresentationsAdminTab from "@/features/admin/PresentationsAdminTab";
import NotificationsAdminTab from "@/features/admin/NotificationsAdminTab";
import CustomizeAdminTab from "@/features/admin/CustomizeAdminTab";
import ContentManagerTab from "@/features/admin/ContentManagerTab";
import { Paintbrush, FileEdit } from "lucide-react";

// ------------------------------------------------------------
// Animation variants
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Chart colors (KLO brand palette)
// ------------------------------------------------------------

const CHART_COLORS = {
  gold: "#C8A84E",
  blue: "#2764FF",
  cyan: "#21B8CD",
  purple: "#8840FF",
  lime: "#6ECF55",
  magenta: "#F77A81",
};

const TIER_COLORS = {
  free: CHART_COLORS.cyan,
  pro: CHART_COLORS.blue,
  executive: CHART_COLORS.gold,
};

// ------------------------------------------------------------
// Stat Card component
// ------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-klo-accent/10">
          <Icon className="w-5 h-5 text-klo-gold" />
        </div>
        <span className="text-sm text-klo-muted">{label}</span>
      </div>
      <p className="text-3xl font-bold text-klo-text font-display">{value}</p>
      {sub && <p className="text-xs text-klo-muted mt-1">{sub}</p>}
    </div>
  );
}

// ------------------------------------------------------------
// Tab definitions
// ------------------------------------------------------------

type TabId = "overview" | "users" | "content" | "revenue" | "conference" | "presentations" | "events" | "inquiries" | "notifications" | "tools" | "customize" | "content-manager";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "customize", label: "Customize", icon: Paintbrush },
  { id: "content-manager", label: "Content", icon: FileEdit },
  { id: "events", label: "Events", icon: Vote },
  { id: "conference", label: "Conference", icon: BarChart3 },
  { id: "inquiries", label: "Inquiries", icon: Inbox },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "presentations", label: "Presentations", icon: ClipboardCheck },
  { id: "users", label: "Users", icon: Users },
  { id: "content", label: "Content", icon: BotMessageSquare },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "tools", label: "Tools", icon: Lock },
];

// ------------------------------------------------------------
// Custom tooltip
// ------------------------------------------------------------

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 border border-white/10 text-sm">
      <p className="text-klo-muted">{label}</p>
      <p className="text-klo-text font-semibold">{payload[0].value}</p>
    </div>
  );
}

// ------------------------------------------------------------
// Main Admin Page
// ------------------------------------------------------------

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "overview";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activity, setActivity] = useState<AdminActivityData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userTierFilter, setUserTierFilter] = useState("all");
  const [assessmentResults, setAssessmentResults] = useState<AdminAssessmentResult[]>([]);
  const [assessmentsTotal, setAssessmentsTotal] = useState(0);
  const [assessmentsPage, setAssessmentsPage] = useState(1);
  const [assessmentsTotalPages, setAssessmentsTotalPages] = useState(1);
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState("all");
  const [pollStats, setPollStats] = useState<{ total: number; totalVotes: number; active: number }>({ total: 0, totalVotes: 0, active: 0 });
  const [inquiriesNewCount, setInquiriesNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = ["owner", "admin"].includes(userRole ?? "");

  // Redirect non-admins
  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.replace("/");
    }
  }, [session, status, isAdmin, router]);

  // Fetch stats + activity
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, activityRes, pollsRes, inquiriesRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity"),
        fetch("/api/conference/polls"),
        fetch("/api/admin/inquiries?limit=1"),
      ]);
      if (!statsRes.ok || !activityRes.ok) {
        throw new Error("Failed to load dashboard data");
      }
      setStats(await statsRes.json());
      setActivity(await activityRes.json());
      if (pollsRes.ok) {
        const pollsData = await pollsRes.json();
        // Only count polls that belong to an event (ignore orphans with no event_id)
        const linkedPolls = pollsData.filter((p: { event_id?: string | null }) => p.event_id);
        setPollStats({
          total: linkedPolls.length,
          totalVotes: linkedPolls.reduce((sum: number, p: { totalVotes: number }) => sum + p.totalVotes, 0),
          active: linkedPolls.filter((p: { is_active: boolean; is_deployed: boolean }) => p.is_active && p.is_deployed).length,
        });
      }
      if (inquiriesRes.ok) {
        const inquiriesData = await inquiriesRes.json();
        setInquiriesNewCount(inquiriesData.newCount ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchDashboardData();
  }, [isAdmin, fetchDashboardData]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(usersPage),
        limit: "20",
        search: userSearch,
        tier: userTierFilter,
        sortBy: "created_at",
        sortOrder: "desc",
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users);
      setUsersTotal(data.total);
      setUsersTotalPages(data.totalPages);
    } catch {
      // Silently handle — stats area will show main error
    }
  }, [usersPage, userSearch, userTierFilter]);

  useEffect(() => {
    if (isAdmin && activeTab === "users") fetchUsers();
  }, [isAdmin, activeTab, fetchUsers]);

  // Fetch assessment results
  const fetchAssessmentResults = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(assessmentsPage),
        limit: "20",
        search: assessmentSearch,
        type: assessmentTypeFilter,
      });
      const res = await fetch(`/api/admin/assessments?${params}`);
      if (!res.ok) throw new Error("Failed to load assessment results");
      const data = await res.json();
      setAssessmentResults(data.results);
      setAssessmentsTotal(data.total);
      setAssessmentsTotalPages(data.totalPages);
    } catch {
      // Silently handle — stats area will show main error
    }
  }, [assessmentsPage, assessmentSearch, assessmentTypeFilter]);

  useEffect(() => {
    if (isAdmin && (activeTab === "content" || activeTab === "tools")) fetchAssessmentResults();
  }, [isAdmin, activeTab, fetchAssessmentResults]);

  // Delete assessment result(s)
  const deleteAssessments = useCallback(
    async (ids?: string[]) => {
      setDeleting(true);
      try {
        const res = await fetch("/api/admin/assessments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ids ? { ids } : {}),
        });
        if (!res.ok) throw new Error("Delete failed");
        const data = await res.json();
        // Refresh both the results table and dashboard stats
        await Promise.all([fetchAssessmentResults(), fetchDashboardData()]);
        return data.deleted as number;
      } catch {
        setError("Failed to delete assessment results");
        return 0;
      } finally {
        setDeleting(false);
      }
    },
    [fetchAssessmentResults, fetchDashboardData]
  );

  const handleDeleteSingle = useCallback(async () => {
    if (!deleteTargetId) return;
    await deleteAssessments([deleteTargetId]);
    setDeleteModalOpen(false);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteAssessments]);

  const handleResetAll = useCallback(async () => {
    await deleteAssessments();
    setResetModalOpen(false);
    setResetConfirmText("");
  }, [deleteAssessments]);

  // Don't render until auth check completes
  if (status === "loading" || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-klo-gold animate-spin" />
      </div>
    );
  }

  // Tier distribution chart data
  const tierData = stats
    ? [
        { name: "Free", value: stats.users.byTier.free, fill: TIER_COLORS.free },
        { name: "Pro", value: stats.users.byTier.pro, fill: TIER_COLORS.pro },
        { name: "Executive", value: stats.users.byTier.executive, fill: TIER_COLORS.executive },
      ]
    : [];

  return (
    <div className="min-h-screen px-4 sm:px-6 py-24 md:py-32">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Admin Dashboard
              </h1>
              <p className="text-klo-muted mt-1">
                Monitor app health, growth, and engagement
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => router.push("/admin/changelog")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm"
              >
                <ScrollText className="w-4 h-4" />
                Changelog
              </button>
              <button
                onClick={() => router.push("/admin/request-update")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2764FF]/10 border border-[#2764FF]/20 text-[#2764FF] hover:bg-[#2764FF]/20 transition-colors text-sm"
              >
                <Send className="w-4 h-4" />
                Request Update
              </button>
              <button
                onClick={() => router.push("/admin/training")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-klo-gold/10 border border-klo-gold/20 text-klo-gold hover:bg-klo-gold/20 transition-colors text-sm"
              >
                <BookOpen className="w-4 h-4" />
                Training Guide
              </button>
              <button
                onClick={fetchDashboardData}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-klo-slate border border-white/10 text-klo-muted hover:text-klo-text transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeUp} custom={1} className="mb-8">
          <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/50 border border-white/5 overflow-x-auto scroll-touch scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 min-h-[44px] ${
                    activeTab === tab.id
                      ? "bg-klo-slate text-klo-text shadow-md"
                      : "text-klo-muted hover:text-klo-text"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                  {tab.id === "inquiries" && inquiriesNewCount > 0 && (
                    <span className="ml-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                      {inquiriesNewCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Error state */}
        {error && (
          <motion.div
            variants={fadeUp}
            custom={2}
            className="glass rounded-2xl p-6 border border-red-500/20 mb-8"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Loading state (only for data-dependent tabs) */}
        {loading && activeTab !== "conference" && activeTab !== "events" && activeTab !== "inquiries" && activeTab !== "tools" && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-klo-gold animate-spin" />
          </div>
        )}

        {/* OVERVIEW TAB */}
        {!loading && activeTab === "overview" && stats && activity && (
          <div className="space-y-8">
            {/* Stat cards */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard
                label="Total Users"
                value={stats.users.total}
                icon={Users}
                sub={`+${stats.users.newLast7Days} this week`}
              />
              <StatCard
                label="Active Subscriptions"
                value={stats.subscriptions.total}
                icon={CreditCard}
              />
              <StatCard
                label="MRR"
                value={`$${stats.subscriptions.mrr.toLocaleString()}`}
                icon={DollarSign}
              />
              <StatCard
                label="AI Queries"
                value={stats.advisor.totalMessages}
                icon={BotMessageSquare}
                sub={`${stats.advisor.totalTokens.toLocaleString()} tokens used`}
              />
            </motion.div>

            {/* Poll stat cards */}
            <motion.div
              variants={fadeUp}
              custom={2.5}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <StatCard
                label="Total Polls"
                value={pollStats.total}
                icon={BarChart3}
              />
              <StatCard
                label="Total Votes"
                value={pollStats.totalVotes}
                icon={Vote}
              />
              <StatCard
                label="Active Polls"
                value={pollStats.active}
                icon={BarChart3}
                sub="Currently live"
              />
            </motion.div>

            {/* User signups chart */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="glass rounded-2xl p-6 border border-white/5"
            >
              <h3 className="text-lg font-semibold text-klo-text mb-4">
                User Signups — Last 30 Days
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activity.signups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis
                    dataKey="date"
                    stroke="#8B949E"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis stroke="#8B949E" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.blue}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: CHART_COLORS.blue }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Two-column: Tier distribution + AI usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                variants={fadeUp}
                custom={4}
                className="glass rounded-2xl p-6 border border-white/5"
              >
                <h3 className="text-lg font-semibold text-klo-text mb-4">
                  Subscription Tiers
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tierData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                    <XAxis dataKey="name" stroke="#8B949E" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#8B949E" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {tierData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={5}
                className="glass rounded-2xl p-6 border border-white/5"
              >
                <h3 className="text-lg font-semibold text-klo-text mb-4">
                  AI Advisor Usage Trend
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={activity.advisorUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                    <XAxis
                      dataKey="date"
                      stroke="#8B949E"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis stroke="#8B949E" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={CHART_COLORS.purple}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: CHART_COLORS.purple }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {!loading && activeTab === "users" && (
          <div className="space-y-6">
            {/* Search & filter bar */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-klo-muted" />
                <input
                  type="text"
                  placeholder="Search by name or organization..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
                />
              </div>
              <select
                value={userTierFilter}
                onChange={(e) => {
                  setUserTierFilter(e.target.value);
                  setUsersPage(1);
                }}
                className="px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text text-sm focus:outline-none focus:border-klo-gold/50"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="executive">Executive</option>
              </select>
            </motion.div>

            {/* Users table */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="glass rounded-2xl border border-white/5 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-4 text-klo-muted font-medium">Name</th>
                      <th className="text-left px-6 py-4 text-klo-muted font-medium hidden md:table-cell">Organization</th>
                      <th className="text-left px-6 py-4 text-klo-muted font-medium">Tier</th>
                      <th className="text-left px-6 py-4 text-klo-muted font-medium hidden sm:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-klo-text font-medium">
                            {user.full_name || "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-klo-muted hidden md:table-cell">
                          {user.organization_name || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.subscription_tier === "executive"
                                ? "bg-klo-gold/20 text-klo-gold"
                                : user.subscription_tier === "pro"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-white/10 text-klo-muted"
                            }`}
                          >
                            {user.subscription_tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-klo-muted hidden sm:table-cell">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-klo-muted">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {usersTotalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                  <p className="text-sm text-klo-muted">
                    {usersTotal} users total
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                      disabled={usersPage <= 1}
                      className="p-2 rounded-lg hover:bg-white/5 text-klo-muted disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-klo-text">
                      {usersPage} / {usersTotalPages}
                    </span>
                    <button
                      onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                      disabled={usersPage >= usersTotalPages}
                      className="p-2 rounded-lg hover:bg-white/5 text-klo-muted disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* CONTENT TAB */}
        {!loading && activeTab === "content" && stats && activity && (
          <div className="space-y-6">
            {/* Content stat cards */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <StatCard
                label="Vault Content"
                value={stats.vault.totalContent}
                icon={Lock}
              />
              <StatCard
                label="Assessments Completed"
                value={stats.assessments.totalCompleted}
                icon={ClipboardCheck}
              />
              <StatCard
                label="Active Strategy Rooms"
                value={stats.strategyRooms.activeRooms}
                icon={LayoutDashboard}
              />
            </motion.div>

            {/* Assessment completions chart */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="glass rounded-2xl p-6 border border-white/5"
            >
              <h3 className="text-lg font-semibold text-klo-text mb-4">
                Assessment Completions — Last 30 Days
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activity.assessments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis
                    dataKey="date"
                    stroke="#8B949E"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis stroke="#8B949E" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.lime}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: CHART_COLORS.lime }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Assessments by type + Vault by type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                variants={fadeUp}
                custom={4}
                className="glass rounded-2xl p-6 border border-white/5"
              >
                <h3 className="text-lg font-semibold text-klo-text mb-4">
                  Assessments by Type
                </h3>
                {Object.keys(stats.assessments.byType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.assessments.byType).map(
                      ([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-klo-muted capitalize text-sm">
                            {type.replace(/-/g, " ")}
                          </span>
                          <span className="text-klo-text font-semibold">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-klo-muted text-sm">No assessments completed yet</p>
                )}
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={5}
                className="glass rounded-2xl p-6 border border-white/5"
              >
                <h3 className="text-lg font-semibold text-klo-text mb-4">
                  Vault Content by Type
                </h3>
                {Object.keys(stats.vault.byType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.vault.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-klo-muted capitalize text-sm">{type}</span>
                        <span className="text-klo-text font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-klo-muted text-sm">No vault content yet</p>
                )}
              </motion.div>
            </div>

            {/* Assessment Results Table */}
            <motion.div variants={fadeUp} custom={6}>
              <h3 className="text-lg font-semibold text-klo-text mb-4">
                Individual Assessment Results
              </h3>

              {/* Search & filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-klo-muted" />
                  <input
                    type="text"
                    placeholder="Search by user name..."
                    value={assessmentSearch}
                    onChange={(e) => {
                      setAssessmentSearch(e.target.value);
                      setAssessmentsPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
                  />
                </div>
                <select
                  value={assessmentTypeFilter}
                  onChange={(e) => {
                    setAssessmentTypeFilter(e.target.value);
                    setAssessmentsPage(1);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text text-sm focus:outline-none focus:border-klo-gold/50"
                >
                  <option value="all">All Types</option>
                  {ASSESSMENTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-6 py-4 text-klo-muted font-medium">User</th>
                        <th className="text-left px-6 py-4 text-klo-muted font-medium">Type</th>
                        <th className="text-left px-6 py-4 text-klo-muted font-medium">Score</th>
                        <th className="text-left px-6 py-4 text-klo-muted font-medium hidden sm:table-cell">Date</th>
                        <th className="px-6 py-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessmentResults.map((result) => {
                        const pct = Math.round(result.score * 100);
                        const assessmentTitle =
                          ASSESSMENTS.find((a) => a.id === result.assessment_type)?.title ??
                          result.assessment_type.replace(/-/g, " ");
                        return (
                          <tr
                            key={result.id}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p className="text-klo-text font-medium">
                                {result.user_name || "—"}
                              </p>
                              <p className="text-xs text-klo-muted">{result.user_email || ""}</p>
                            </td>
                            <td className="px-6 py-4 text-klo-muted capitalize">
                              {assessmentTitle}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  pct >= 70
                                    ? "bg-green-500/20 text-green-400"
                                    : pct >= 40
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {pct}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-klo-muted hidden sm:table-cell">
                              {new Date(result.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => {
                                  setDeleteTargetId(result.id);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                aria-label="Delete result"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {assessmentResults.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-klo-muted">
                            No assessment results found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {assessmentsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                    <p className="text-sm text-klo-muted">
                      {assessmentsTotal} results total
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAssessmentsPage((p) => Math.max(1, p - 1))}
                        disabled={assessmentsPage <= 1}
                        className="p-2 rounded-lg hover:bg-white/5 text-klo-muted disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-klo-text">
                        {assessmentsPage} / {assessmentsTotalPages}
                      </span>
                      <button
                        onClick={() => setAssessmentsPage((p) => Math.min(assessmentsTotalPages, p + 1))}
                        disabled={assessmentsPage >= assessmentsTotalPages}
                        className="p-2 rounded-lg hover:bg-white/5 text-klo-muted disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* REVENUE TAB */}
        {!loading && activeTab === "revenue" && stats && activity && (
          <div className="space-y-6">
            {/* Revenue stat cards */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <StatCard
                label="Monthly Recurring Revenue"
                value={`$${stats.subscriptions.mrr.toLocaleString()}`}
                icon={DollarSign}
              />
              <StatCard
                label="Paid Subscriptions"
                value={stats.subscriptions.total}
                icon={CreditCard}
              />
              <StatCard
                label="Total Users"
                value={stats.users.total}
                icon={TrendingUp}
                sub={`${stats.users.total > 0 ? Math.round(((stats.users.byTier.pro + stats.users.byTier.executive) / stats.users.total) * 100) : 0}% conversion rate`}
              />
            </motion.div>

            {/* Subscription conversions chart */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="glass rounded-2xl p-6 border border-white/5"
            >
              <h3 className="text-lg font-semibold text-klo-text mb-4">
                Subscription Conversions — Last 30 Days
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activity.subscriptionConversions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis
                    dataKey="date"
                    stroke="#8B949E"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis stroke="#8B949E" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.gold}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: CHART_COLORS.gold }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Tier breakdown + Conversion funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                variants={fadeUp}
                custom={4}
                className="glass rounded-2xl p-6 border border-white/5"
              >
                <h3 className="text-lg font-semibold text-klo-text mb-4">
                  Subscription Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }: { name?: string; value?: number }) =>
                        `${name ?? ""}: ${value ?? 0}`
                      }
                    >
                      {tierData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={5}
                className="glass rounded-2xl p-6 border border-white/5"
              >
                <h3 className="text-lg font-semibold text-klo-text mb-4">
                  Conversion Funnel
                </h3>
                <div className="space-y-4 mt-6">
                  {[
                    {
                      label: "Total Signups",
                      value: stats.users.total,
                      pct: 100,
                      color: CHART_COLORS.cyan,
                    },
                    {
                      label: "Free Tier",
                      value: stats.users.byTier.free,
                      pct: stats.users.total
                        ? Math.round((stats.users.byTier.free / stats.users.total) * 100)
                        : 0,
                      color: CHART_COLORS.cyan,
                    },
                    {
                      label: "Pro",
                      value: stats.users.byTier.pro,
                      pct: stats.users.total
                        ? Math.round((stats.users.byTier.pro / stats.users.total) * 100)
                        : 0,
                      color: CHART_COLORS.blue,
                    },
                    {
                      label: "Executive",
                      value: stats.users.byTier.executive,
                      pct: stats.users.total
                        ? Math.round((stats.users.byTier.executive / stats.users.total) * 100)
                        : 0,
                      color: CHART_COLORS.gold,
                    },
                  ].map((step) => (
                    <div key={step.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-klo-muted">{step.label}</span>
                        <span className="text-klo-text font-medium">
                          {step.value} ({step.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${step.pct}%`,
                            backgroundColor: step.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
        {/* CONFERENCE TAB */}
        {activeTab === "conference" && (
          <ConferenceAdminTab />
        )}

        {/* PRESENTATIONS TAB */}
        {activeTab === "presentations" && (
          <PresentationsAdminTab />
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <EventsAdminTab />
        )}

        {/* INQUIRIES TAB */}
        {activeTab === "inquiries" && (
          <InquiriesAdminTab />
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <NotificationsAdminTab />
        )}

        {/* CUSTOMIZE TAB */}
        {activeTab === "customize" && (
          <CustomizeAdminTab />
        )}

        {/* CONTENT MANAGER TAB */}
        {activeTab === "content-manager" && (
          <ContentManagerTab />
        )}

        {/* TOOLS TAB */}
        {activeTab === "tools" && (
          <div className="space-y-6">
            <motion.div variants={fadeUp} custom={2}>
              <div className="glass rounded-2xl p-6 border border-red-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-red-500/10">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-klo-text">Danger Zone</h3>
                    <p className="text-sm text-klo-muted">
                      Destructive actions that cannot be undone
                    </p>
                  </div>
                </div>

                <div className="border-t border-red-500/10 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-klo-text font-medium">Reset All Assessment Results</p>
                      <p className="text-sm text-klo-muted">
                        Permanently delete all {assessmentsTotal} assessment results from the database
                      </p>
                    </div>
                    <button
                      onClick={() => setResetModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      Reset All
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Single delete confirmation modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteTargetId(null);
          }}
          title="Delete Assessment Result"
          size="sm"
        >
          <p className="text-klo-muted mb-6">
            Are you sure you want to delete this assessment result? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteTargetId(null);
              }}
              className="px-4 py-2 rounded-xl bg-klo-slate border border-white/10 text-klo-muted hover:text-klo-text transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSingle}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>

        {/* Reset all confirmation modal */}
        <Modal
          isOpen={resetModalOpen}
          onClose={() => {
            setResetModalOpen(false);
            setResetConfirmText("");
          }}
          title="Reset All Assessment Results"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">
                This will permanently delete all {assessmentsTotal} assessment results. This action cannot be undone.
              </p>
            </div>
            <div>
              <label className="block text-sm text-klo-muted mb-2">
                Type <span className="text-klo-text font-mono font-bold">RESET</span> to confirm
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setResetModalOpen(false);
                  setResetConfirmText("");
                }}
                className="px-4 py-2 rounded-xl bg-klo-slate border border-white/10 text-klo-muted hover:text-klo-text transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAll}
                disabled={resetConfirmText !== "RESET" || deleting}
                className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Resetting..." : "Reset All Results"}
              </button>
            </div>
          </div>
        </Modal>
      </motion.div>
    </div>
  );
}
