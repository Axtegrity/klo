"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
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
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import { useSubscription } from "@/hooks/useSubscription";

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
  const [results, setResults] = useState<AssessmentResult[]>([]);

  useEffect(() => {
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
      setResults(assessmentResults);
    } catch {
      // localStorage unavailable
    }
  }, []);

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

function SettingsTab() {
  const [formData, setFormData] = useState({
    fullName: "Keith Demo User",
    organization: "KLO Consulting",
    orgType: "consulting",
    industry: "Technology & Ministry",
    teamSize: "11-50",
  });
  const [notifications, setNotifications] = useState({
    emailDigests: true,
    assessmentReminders: true,
    newVaultContent: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

      {/* Actions */}
      <motion.div variants={fadeUp} custom={2} className="flex flex-col gap-4">
        <Button variant="primary" onClick={handleSave}>
          {saved ? "Changes Saved!" : "Save Changes"}
        </Button>
        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const { tier } = useSubscription();

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
                K
              </span>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-klo-text mb-1">
                Keith Demo User
              </h1>
              <p className="text-klo-muted text-sm mb-3">demo@klo.ai</p>
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
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 cursor-pointer border-b-2 -mb-[1px] ${
                  activeTab === tab.id
                    ? "text-[#2764FF] border-[#2764FF] bg-[#2764FF]/5"
                    : "text-[#8B949E] border-transparent hover:text-klo-text hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
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
