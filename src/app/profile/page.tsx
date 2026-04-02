"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bookmark,
  Settings,
  Crown,
  Activity,
  Brain,
  MessageSquare,
  Archive,
  CalendarDays,
  ChevronRight,
  LogOut,
  Trash2,
  Bell,
  Mail,
  FileText,
  Fingerprint,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import Modal from "@/components/shared/Modal";
import { useSubscription } from "@/hooks/useSubscription";
import { signOut, useSession } from "next-auth/react";
import { haptics } from "@/lib/haptics";
import { isBiometricAvailable, biometricVerify } from "@/lib/biometric-auth";
import {
  isBiometricLockEnabled,
  setBiometricLockEnabled,
} from "@/components/layout/BiometricGate";

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
  visible: { transition: { staggerChildren: 0.08 } },
};

type ProfileTab = "overview" | "assessments" | "saved" | "settings";

const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Activity size={16} /> },
  { id: "assessments", label: "Assessment Results", icon: <BarChart3 size={16} /> },
  { id: "saved", label: "Saved Content", icon: <Bookmark size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

interface AssessmentResult {
  assessmentId: string;
  assessmentTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  maturityLevel: string;
}

interface SavedItem {
  id: string;
  title: string;
  type: string;
  category: string;
}

const mockSavedItems: SavedItem[] = [
  {
    id: "saved-1",
    title: "AI Ethics Framework for Organizations",
    type: "Framework",
    category: "Governance",
  },
  {
    id: "saved-2",
    title: "Church Digital Transformation Playbook",
    type: "Playbook",
    category: "Strategy",
  },
  {
    id: "saved-3",
    title: "Data Privacy Compliance Checklist",
    type: "Checklist",
    category: "Compliance",
  },
  {
    id: "saved-4",
    title: "AI Vendor Evaluation Rubric",
    type: "Template",
    category: "Procurement",
  },
];

const mockActivity = [
  {
    id: "act-1",
    text: "Completed Church Readiness Assessment — Score: 72%",
    icon: <Brain size={16} className="text-[#C8A84E]" />,
    date: "2 days ago",
  },
  {
    id: "act-2",
    text: 'Asked AI Advisor about data governance frameworks',
    icon: <MessageSquare size={16} className="text-blue-400" />,
    date: "4 days ago",
  },
  {
    id: "act-3",
    text: "Saved 'AI Ethics Framework' to Vault",
    icon: <Bookmark size={16} className="text-emerald-400" />,
    date: "1 week ago",
  },
  {
    id: "act-4",
    text: "Completed Executive AI Readiness Assessment — Score: 85%",
    icon: <Brain size={16} className="text-[#C8A84E]" />,
    date: "2 weeks ago",
  },
];

function getMaturityBadgeVariant(level: string): "gold" | "blue" | "green" | "muted" {
  if (level.toLowerCase().includes("advanced") || level.toLowerCase().includes("leading"))
    return "gold";
  if (level.toLowerCase().includes("developing") || level.toLowerCase().includes("intermediate"))
    return "blue";
  if (level.toLowerCase().includes("emerging") || level.toLowerCase().includes("beginning"))
    return "green";
  return "muted";
}

function OverviewTab() {
  const stats = [
    { label: "Assessments Completed", value: "2", icon: <Brain size={20} className="text-[#C8A84E]" /> },
    { label: "Advisor Queries Used", value: "3/5", icon: <MessageSquare size={20} className="text-blue-400" /> },
    { label: "Vault Items Saved", value: "4", icon: <Archive size={20} className="text-emerald-400" /> },
    { label: "Member Since", value: "Feb 2026", icon: <CalendarDays size={20} className="text-klo-muted" /> },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} variants={fadeUp} custom={i}>
            <Card className="text-center">
              <div className="flex justify-center mb-3">{stat.icon}</div>
              <p className="font-display text-2xl font-bold text-klo-text mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-klo-muted">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp} custom={4}>
        <h3 className="font-display text-lg font-semibold text-klo-text mb-4">
          Recent Activity
        </h3>
        <Card>
          <div className="divide-y divide-klo-slate">
            {mockActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="mt-0.5">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-klo-text">{item.text}</p>
                  <p className="text-xs text-klo-muted mt-0.5">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function AssessmentsTab() {
  const [results, setResults] = useState<AssessmentResult[]>(() => {
    // Start with localStorage results
    if (typeof window === "undefined") return [];
    try {
      const keys = Object.keys(localStorage);
      const assessmentResults: AssessmentResult[] = [];
      for (const key of keys) {
        if (key.startsWith("klo-assessment-")) {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          if (data && data.score !== undefined) {
            assessmentResults.push(data);
          }
        }
      }
      return assessmentResults;
    } catch {
      return [];
    }
  });

  // Also fetch from Supabase for server-persisted results
  useState(() => {
    fetch("/api/assessments")
      .then((res) => (res.ok ? res.json() : []))
      .then((serverResults: Array<{ assessment_type: string; score: number; created_at: string }>) => {
        if (serverResults && serverResults.length > 0) {
          const mapped: AssessmentResult[] = serverResults.map((r) => ({
            assessmentId: r.assessment_type,
            assessmentTitle: r.assessment_type.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
            score: r.score,
            totalQuestions: 10,
            completedAt: r.created_at,
            maturityLevel: r.score >= 43 ? "Leading" : r.score >= 36 ? "Advanced" : r.score >= 26 ? "Established" : r.score >= 16 ? "Developing" : "Emerging",
          }));
          setResults((prev) => {
            // Merge: prefer server results, deduplicate by assessmentId
            const existing = new Set(prev.map((p) => p.assessmentId));
            const newResults = mapped.filter((m) => !existing.has(m.assessmentId));
            return [...prev, ...newResults];
          });
        }
      })
      .catch(() => { /* localStorage results are fallback */ });
  });

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="text-center py-16"
      >
        <BarChart3 size={48} className="text-klo-muted mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold text-klo-text mb-2">
          No assessments completed yet
        </h3>
        <p className="text-klo-muted text-sm mb-6 max-w-md mx-auto">
          Take your first assessment to discover your organization&apos;s AI readiness
          and get personalized recommendations.
        </p>
        <Button variant="primary" href="/assessments">
          Start an Assessment
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-4"
    >
      {results.map((result, i) => (
        <motion.div key={result.assessmentId || i} variants={fadeUp} custom={i}>
          <Card hoverable>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-display text-lg font-semibold text-klo-text mb-1">
                  {result.assessmentTitle || "Assessment"}
                </h4>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={getMaturityBadgeVariant(result.maturityLevel || "")}>
                    {result.maturityLevel || "Completed"}
                  </Badge>
                  <span className="text-sm text-klo-muted">
                    Score: {result.score}%
                  </span>
                  {result.completedAt && (
                    <span className="text-xs text-klo-muted">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" href="/assessments">
                View Report <ChevronRight size={14} />
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function SavedContentTab() {
  const [items, setItems] = useState<SavedItem[]>(mockSavedItems);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="text-center py-16"
      >
        <Bookmark size={48} className="text-klo-muted mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold text-klo-text mb-2">
          No saved content yet
        </h3>
        <p className="text-klo-muted text-sm mb-6 max-w-md mx-auto">
          Browse the Vault to find frameworks, templates, and resources to save for
          later.
        </p>
        <Button variant="primary" href="/vault">
          Explore the Vault
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {items.map((item, i) => (
        <motion.div key={item.id} variants={fadeUp} custom={i}>
          <Card hoverable className="flex flex-col h-full">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex gap-2">
                <Badge variant="blue">{item.type}</Badge>
                <Badge variant="muted">{item.category}</Badge>
              </div>
            </div>
            <h4 className="font-display text-base font-semibold text-klo-text mb-4 flex-1">
              {item.title}
            </h4>
            <button
              onClick={() => removeItem(item.id)}
              className="inline-flex items-center gap-1.5 text-red-400 text-xs font-medium hover:text-red-300 transition-colors cursor-pointer self-start"
            >
              <Trash2 size={12} />
              Remove
            </button>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function PushNotificationRow() {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      // Check native first
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          setPushSupported(true);
          const { checkPushPermission } = await import("@/lib/push-notifications");
          const enabled = await checkPushPermission();
          setPushEnabled(enabled);
          return;
        }
      } catch {}

      // Check web push
      const { isWebPushSupported, getExistingSubscription } = await import("@/lib/web-push-client");
      if (isWebPushSupported()) {
        setPushSupported(true);
        const existing = await getExistingSubscription();
        setPushEnabled(!!existing);
      }
    }
    checkStatus();
  }, []);

  if (!pushSupported) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      // Check if native
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        if (!pushEnabled) {
          const { initPushNotifications } = await import("@/lib/push-notifications");
          const token = await initPushNotifications();
          if (token) {
            localStorage.setItem("klo-push-token", token);
            setPushEnabled(true);
            haptics.success();
          }
        }
      } else {
        // Web push
        if (pushEnabled) {
          const { unsubscribeFromWebPush } = await import("@/lib/web-push-client");
          await unsubscribeFromWebPush();
          setPushEnabled(false);
          haptics.light();
        } else {
          const { subscribeToWebPush } = await import("@/lib/web-push-client");
          const sub = await subscribeToWebPush();
          if (sub) {
            setPushEnabled(true);
            haptics.success();
          }
        }
      }
    } catch {
      // Permission denied or error
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Bell size={16} className="text-[#C8A84E]" />
        <div>
          <p className="text-sm font-medium text-klo-text">Push Notifications</p>
          <p className="text-xs text-klo-muted">
            {pushEnabled ? "Enabled" : "Disabled"} — receive alerts on your device
          </p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={pushEnabled}
        aria-label="Push Notifications"
        onClick={handleToggle}
        disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-50 ${
          pushEnabled ? "bg-[#2764FF]" : "bg-klo-slate"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
            pushEnabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SettingsTab() {
  const { data: session, update: updateSession } = useSession();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    organization: "",
    orgType: "consulting",
    industry: "",
    teamSize: "11-50",
  });
  const [notifications, setNotifications] = useState({
    emailDigests: true,
    assessmentReminders: true,
    newVaultContent: false,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showMfaDisable, setShowMfaDisable] = useState(false);
  const [mfaQrUri, setMfaQrUri] = useState("");
  const [mfaEncryptedSecret, setMfaEncryptedSecret] = useState("");
  const [mfaSetupCode, setMfaSetupCode] = useState("");
  const [mfaSetupStep, setMfaSetupStep] = useState<"qr" | "backup">("qr");
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaDisableCode, setMfaDisableCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaCopied, setMfaCopied] = useState(false);

  // Load profile from session + Supabase
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      fullName: session?.user?.name || "",
    }));
    // Fetch profile data from Supabase
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setFormData((prev) => ({
            ...prev,
            fullName: data.full_name || session?.user?.name || "",
            organization: data.organization_name || "",
            orgType: data.organization_type || "consulting",
            industry: data.industry || "",
            teamSize: data.team_size || "11-50",
          }));
        }
      })
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    isBiometricAvailable().then((available) => {
      setBiometricAvailable(available);
      if (available) {
        setBiometricEnabled(isBiometricLockEnabled());
      }
    });
  }, []);

  // Load MFA status
  useEffect(() => {
    fetch("/api/auth/mfa/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMfaEnabled(data.mfaEnabled ?? false);
      })
      .catch(() => {});
  }, []);

  const handleMfaSetupOpen = async () => {
    setMfaError("");
    setMfaSetupCode("");
    setMfaSetupStep("qr");
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setMfaError(data.error ?? "Failed to start setup"); return; }
      setMfaQrUri(data.uri);
      setMfaEncryptedSecret(data.encryptedSecret);
      setShowMfaSetup(true);
    } catch {
      setMfaError("Failed to start setup");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaConfirmSetup = async () => {
    setMfaError("");
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedSecret: mfaEncryptedSecret, code: mfaSetupCode }),
      });
      const data = await res.json();
      if (!res.ok) { setMfaError(data.error ?? "Invalid code"); setMfaLoading(false); return; }
      setMfaBackupCodes(data.backupCodes);
      setMfaSetupStep("backup");
      setMfaEnabled(true);
      haptics.success();
    } catch {
      setMfaError("Something went wrong");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaDisable = async () => {
    setMfaError("");
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaDisableCode }),
      });
      const data = await res.json();
      if (!res.ok) { setMfaError(data.error ?? "Invalid code"); setMfaLoading(false); return; }
      setMfaEnabled(false);
      setShowMfaDisable(false);
      setMfaDisableCode("");
      haptics.success();
    } catch {
      setMfaError("Something went wrong");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    await navigator.clipboard.writeText(mfaBackupCodes.join("\n"));
    setMfaCopied(true);
    setTimeout(() => setMfaCopied(false), 2000);
  };

  const handleBiometricToggle = async () => {
    if (!biometricEnabled) {
      // Verify identity before enabling
      const verified = await biometricVerify("Enable biometric lock");
      if (verified) {
        setBiometricLockEnabled(true);
        setBiometricEnabled(true);
        haptics.success();
      }
    } else {
      setBiometricLockEnabled(false);
      setBiometricEnabled(false);
      haptics.light();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          organization: formData.organization,
          org_type: formData.orgType,
          industry: formData.industry,
          team_size: formData.teamSize,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Failed to save");
        return;
      }
      // Update the session so the name reflects immediately
      await updateSession({ name: formData.fullName });
      setSaved(true);
      haptics.success();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClasses =
    "w-full bg-[#161B22] border border-[#21262D] rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-[#8B949E]/50 focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50 focus:border-[#2764FF]/50 transition-all";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Profile Form */}
      <motion.div variants={fadeUp} custom={0}>
        <h3 className="font-display text-lg font-semibold text-klo-text mb-4">
          Profile Information
        </h3>
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-klo-muted mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm text-klo-muted mb-1.5">
                Organization
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) =>
                  setFormData({ ...formData, organization: e.target.value })
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm text-klo-muted mb-1.5">
                Organization Type
              </label>
              <select
                value={formData.orgType}
                onChange={(e) =>
                  setFormData({ ...formData, orgType: e.target.value })
                }
                className={inputClasses}
              >
                <option value="church">Church / Ministry</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="education">Education</option>
                <option value="consulting">Consulting</option>
                <option value="enterprise">Enterprise</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-klo-muted mb-1.5">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm text-klo-muted mb-1.5">
                Team Size
              </label>
              <select
                value={formData.teamSize}
                onChange={(e) =>
                  setFormData({ ...formData, teamSize: e.target.value })
                }
                className={inputClasses}
              >
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
              </select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div variants={fadeUp} custom={1}>
        <h3 className="font-display text-lg font-semibold text-klo-text mb-4">
          Notification Preferences
        </h3>
        <Card>
          <div className="space-y-4">
            <PushNotificationRow />
            {[
              {
                key: "emailDigests" as const,
                label: "Email Digests",
                description: "Weekly summary of new feed posts and updates",
                icon: <Mail size={16} className="text-[#C8A84E]" />,
              },
              {
                key: "assessmentReminders" as const,
                label: "Assessment Reminders",
                description: "Reminders to retake assessments and track progress",
                icon: <Bell size={16} className="text-blue-400" />,
              },
              {
                key: "newVaultContent" as const,
                label: "New Vault Content Alerts",
                description:
                  "Get notified when new frameworks and resources are added",
                icon: <FileText size={16} className="text-emerald-400" />,
              },
            ].map((pref) => (
              <div
                key={pref.key}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  {pref.icon}
                  <div>
                    <p className="text-sm font-medium text-klo-text">
                      {pref.label}
                    </p>
                    <p className="text-xs text-klo-muted">{pref.description}</p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={notifications[pref.key]}
                  aria-label={pref.label}
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      [pref.key]: !notifications[pref.key],
                    })
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                    notifications[pref.key] ? "bg-[#2764FF]" : "bg-klo-slate"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                      notifications[pref.key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Biometric Lock — only visible on native with biometric hardware */}
      {biometricAvailable && (
        <motion.div variants={fadeUp} custom={2}>
          <h3 className="font-display text-lg font-semibold text-klo-text mb-4">
            Security
          </h3>
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Fingerprint size={16} className="text-[#C8A84E]" />
                <div>
                  <p className="text-sm font-medium text-klo-text">
                    Biometric Lock
                  </p>
                  <p className="text-xs text-klo-muted">
                    Require Face ID or Touch ID when reopening the app
                  </p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={biometricEnabled}
                aria-label="Biometric Lock"
                onClick={handleBiometricToggle}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                  biometricEnabled ? "bg-[#2764FF]" : "bg-klo-slate"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                    biometricEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Two-Factor Authentication */}
      <motion.div variants={fadeUp} custom={2.3}>
        <h3 className="font-display text-lg font-semibold text-klo-text mb-4">
          Two-Factor Authentication
        </h3>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {mfaEnabled
                ? <ShieldCheck size={16} className="text-emerald-400" />
                : <ShieldOff size={16} className="text-klo-muted" />
              }
              <div>
                <p className="text-sm font-medium text-klo-text">
                  Authenticator App (TOTP)
                </p>
                <p className="text-xs text-klo-muted">
                  {mfaEnabled
                    ? "Enabled — your account is protected"
                    : "Disabled — add an extra layer of security"}
                </p>
              </div>
            </div>
            {mfaEnabled ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => { setMfaError(""); setMfaDisableCode(""); setShowMfaDisable(true); }}
              >
                Disable
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMfaSetupOpen}
                disabled={mfaLoading}
              >
                {mfaLoading ? "Loading..." : "Enable"}
              </Button>
            )}
          </div>
          {mfaError && !showMfaSetup && !showMfaDisable && (
            <p className="mt-3 text-xs text-red-400">{mfaError}</p>
          )}
        </Card>
      </motion.div>

      {/* MFA Setup Modal */}
      <Modal
        isOpen={showMfaSetup}
        onClose={() => { setShowMfaSetup(false); setMfaSetupCode(""); setMfaSetupStep("qr"); setMfaBackupCodes([]); setMfaError(""); }}
        title={mfaSetupStep === "qr" ? "Set Up Two-Factor Authentication" : "Save Your Backup Codes"}
        size="md"
      >
        {mfaSetupStep === "qr" ? (
          <div className="space-y-5">
            <p className="text-sm text-klo-muted">
              Scan this QR code with your authenticator app (Google Authenticator,
              Authy, 1Password, etc.), then enter the 6-digit code to confirm.
            </p>
            {/* QR Code rendered via a free QR API — no data sent to third party, URI is already encoded */}
            {mfaQrUri && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaQrUri)}`}
                  alt="Scan this QR code with your authenticator app"
                  width={200}
                  height={200}
                  className="rounded-lg border border-[#21262D]"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-klo-muted mb-1.5">
                Enter the 6-digit code from your app
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={mfaSetupCode}
                onChange={(e) => setMfaSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full bg-[#0D1117] border border-[#30363D] text-klo-text py-3 px-4 rounded-xl focus:outline-none focus:border-[#C8A84E] transition-colors placeholder:text-klo-muted/50 text-center text-lg tracking-[0.25em] font-mono"
              />
            </div>
            {mfaError && (
              <p className="text-xs text-red-400">{mfaError}</p>
            )}
            <Button
              variant="gold"
              onClick={handleMfaConfirmSetup}
              disabled={mfaSetupCode.length !== 6 || mfaLoading}
              className="w-full"
            >
              {mfaLoading ? "Verifying..." : "Confirm & Enable MFA"}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              Save these backup codes in a secure place. Each code can only be used once.
              If you lose your authenticator app, use one of these to regain access.
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mfaBackupCodes.map((code) => (
                <div
                  key={code}
                  className="bg-[#0D1117] border border-[#21262D] rounded-lg px-3 py-2 font-mono text-sm text-klo-text text-center tracking-widest"
                >
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyBackupCodes}
                className="flex-1"
              >
                {mfaCopied ? <Check size={14} /> : <Copy size={14} />}
                {mfaCopied ? "Copied!" : "Copy All"}
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => { setShowMfaSetup(false); setMfaSetupStep("qr"); setMfaBackupCodes([]); }}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MFA Disable Modal */}
      <Modal
        isOpen={showMfaDisable}
        onClose={() => { setShowMfaDisable(false); setMfaDisableCode(""); setMfaError(""); }}
        title="Disable Two-Factor Authentication"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-klo-muted">
            Enter your current authenticator code or a backup code to disable MFA.
          </p>
          <div>
            <label className="block text-xs text-klo-muted mb-1.5">
              Authenticator code or backup code
            </label>
            <input
              type="text"
              autoComplete="off"
              maxLength={8}
              placeholder="000000"
              value={mfaDisableCode}
              onChange={(e) => setMfaDisableCode(e.target.value.replace(/\s/g, "").slice(0, 8))}
              className="w-full bg-[#0D1117] border border-[#30363D] text-klo-text py-3 px-4 rounded-xl focus:outline-none focus:border-[#C8A84E] transition-colors placeholder:text-klo-muted/50 text-center font-mono tracking-widest"
            />
          </div>
          {mfaError && (
            <p className="text-xs text-red-400">{mfaError}</p>
          )}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowMfaDisable(false); setMfaDisableCode(""); setMfaError(""); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleMfaDisable}
              disabled={mfaDisableCode.length < 6 || mfaLoading}
            >
              <KeyRound size={14} />
              {mfaLoading ? "Disabling..." : "Disable MFA"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Actions */}
      {saveError && (
        <motion.div variants={fadeUp} custom={2.5}>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {saveError}
          </div>
        </motion.div>
      )}

      <motion.div variants={fadeUp} custom={3} className="flex flex-col gap-4">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Changes Saved!" : "Save Changes"}
        </Button>
        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </motion.div>

      {/* Delete Account */}
      <motion.div variants={fadeUp} custom={4} className="mt-4 pt-8 border-t border-[#21262D]">
        <h3 className="font-display text-lg font-semibold text-red-400 mb-2">
          Delete Account
        </h3>
        <p className="text-klo-muted text-sm mb-4">
          Permanently delete your account and all associated data including assessment results,
          saved content, and profile information. This action cannot be undone.
        </p>
        {deleteError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {deleteError}
          </div>
        )}
        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => { haptics.warning(); setShowDeleteConfirm(true); }}
          >
            <Trash2 size={16} />
            Delete My Account
          </Button>
        ) : (
          <Card className="border-red-500/30 bg-red-500/5">
            <p className="text-sm text-klo-text mb-4">
              Are you sure? All your data will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError("");
                  try {
                    const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
                    if (!res.ok) {
                      const data = await res.json();
                      setDeleteError(data.error || "Failed to delete account");
                      setDeleting(false);
                      return;
                    }
                    await signOut({ callbackUrl: "/" });
                  } catch {
                    setDeleteError("Something went wrong. Please try again.");
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Yes, Delete Everything"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { tier } = useSubscription();
  const { data: session } = useSession();

  // Support URL-driven tab activation (e.g., /profile?tab=settings)
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialTab = (searchParams?.get("tab") as ProfileTab) || "overview";
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  const tierLabel =
    tier === "free" ? "Free Tier" : tier === "pro" ? "Pro" : "Executive";

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-10"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="flex flex-col sm:flex-row items-center sm:items-start gap-6"
          >
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#2764FF]/15 border-2 border-[#2764FF]/30 flex items-center justify-center shrink-0">
              <span className="font-display text-3xl font-bold text-[#2764FF]">
                {userInitial}
              </span>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-klo-text mb-1">
                {userName}
              </h1>
              <p className="text-klo-muted text-sm mb-3">{userEmail}</p>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <Badge variant="gold">
                  <Crown size={10} className="mr-1" />
                  {tierLabel}
                </Badge>
                {tier === "free" && (
                  <Button variant="secondary" size="sm" href="/pricing">
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            variants={fadeUp}
            custom={1}
            className="flex gap-1 overflow-x-auto pb-2 mt-8 border-b border-klo-slate scrollbar-hide"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                className={`flex items-center gap-2 whitespace-nowrap px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-all duration-200 cursor-pointer border-b-2 -mb-[1px] min-h-[44px] ${
                  activeTab === tab.id
                    ? "text-[#2764FF] border-[#2764FF] bg-[#2764FF]/5"
                    : "text-[#8B949E] border-transparent hover:text-klo-text hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "assessments" && <AssessmentsTab />}
          {activeTab === "saved" && <SavedContentTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
