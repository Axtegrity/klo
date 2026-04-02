"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  LayoutDashboard,
  Vote,
  BarChart3,
  Inbox,
  ClipboardCheck,
  Users,
  BotMessageSquare,
  DollarSign,
  Lock,
  Radio,
  MessageSquare,
  Cloud,
  Megaphone,
  Shield,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  BookOpen,
  PlayCircle,
  Play,
  Pause,
  Volume2,
  Star,
  Upload,
  FileText,
  Search,
  Filter,
  Eye,
  Trash2,
  Plus,
  Globe,
  Pencil,
  Power,
  UserPlus,
  Download,
  Zap,
  Bell,
  Paintbrush,
  FileEdit,
  TrendingUp,
  ScrollText,
  Send,
  RefreshCw,
} from "lucide-react";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface TrainingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  adminTab?: string; // which admin tab this maps to
  steps: TrainingStep[];
  tips?: string[];
  subSections?: TrainingSubSection[];
}

interface TrainingStep {
  icon: React.ElementType;
  label: string;
  detail: string;
}

interface TrainingSubSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  steps: TrainingStep[];
  tips?: string[];
}

// ------------------------------------------------------------
// Training content — update this when features change
// ------------------------------------------------------------

const TRAINING_SECTIONS: TrainingSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: PlayCircle,
    description: "How to access the admin dashboard and navigate its 12 tabs.",
    steps: [
      { icon: Globe, label: "Sign In", detail: "Go to keithlodom.ai and click Sign In, or navigate directly to /auth/signin" },
      { icon: Users, label: "Use Admin Credentials", detail: "Enter your admin email and password. Only owner and admin roles can access the dashboard." },
      { icon: Star, label: "Find the Admin Link", detail: "Once signed in, the gold \"Admin\" link appears in the top navigation bar" },
      { icon: LayoutDashboard, label: "Explore 12 Tabs", detail: "Overview, Customize, Content (Manager), Events, Conference, Inquiries, Notifications, Presentations, Users, Content (Analytics), Revenue, and Tools" },
      { icon: Zap, label: "Header Utilities", detail: "Four buttons in the top-right: Changelog (version history), Request Update (submit change requests), Training Guide (this page), and Refresh (reload data)" },
    ],
    tips: [
      "Only users with the \"admin\" or \"owner\" role can see the Admin link. Moderators have limited conference access.",
      "The Inquiries tab shows a blue badge with the count of new/unread inquiries.",
      "Use the Refresh button (top-right) to reload data on any tab.",
      "For changes to website content not managed in the dashboard, use the \"Request Update\" button — Tim will handle it quickly.",
    ],
  },
  {
    id: "overview",
    title: "Overview Dashboard",
    icon: LayoutDashboard,
    description: "At-a-glance metrics, charts, and growth analytics for the entire platform.",
    adminTab: "overview",
    steps: [
      { icon: Eye, label: "View Stat Cards", detail: "Total Users (with weekly growth), Active Subscriptions, Monthly Recurring Revenue (MRR), AI Queries & tokens, Total Polls, and Active Polls" },
      { icon: BarChart3, label: "User Signups Chart", detail: "Line chart showing new user signups over the last 30 days" },
      { icon: BarChart3, label: "Subscription Tiers", detail: "Bar chart showing the distribution of Free, Pro, and Executive subscribers" },
      { icon: BarChart3, label: "AI Advisor Usage", detail: "Line chart showing AI chat usage trends over time" },
    ],
    tips: [
      "All charts auto-refresh when you click the Refresh button in the header.",
      "Stat cards show growth indicators — green arrows mean positive week-over-week change.",
    ],
  },
  {
    id: "customize",
    title: "Customize",
    icon: Paintbrush,
    description: "Control the app's brand colors, feature visibility, and homepage section order.",
    adminTab: "customize",
    steps: [
      { icon: Paintbrush, label: "Brand Colors", detail: "Edit Primary (#2764FF), Accent/Gold (#C8A84E), Background (#0D1117), Card Surface (#161B22), and Body Text (#E6EDF3) using color pickers" },
      { icon: Power, label: "Feature Toggles", detail: "Enable or disable 9 app features: Assessments, Vault, AI Advisor, Booking, Events, Conference, Strategy Rooms, Feed, and Marketplace. Minimum 3 must stay on." },
      { icon: Eye, label: "Homepage Sections", detail: "Show/hide and reorder 7 homepage sections: Hero Banner (always visible), Upcoming Keynote, Latest Brief, Trending Topics, Featured Insight, AI Tool of the Week, and Assessment CTA" },
      { icon: Download, label: "Save / Reset", detail: "Save changes with a confirmation modal, or reset all settings back to defaults" },
    ],
    tips: [
      "Changes take effect immediately for all users after saving.",
      "The Hero Banner section cannot be hidden — it's always visible on the homepage.",
      "Drag sections to reorder how they appear on the homepage.",
    ],
  },
  {
    id: "content-manager",
    title: "Content Manager",
    icon: FileEdit,
    description: "Edit all user-facing content across the homepage, vault, and feed — without touching code.",
    adminTab: "content-manager",
    steps: [
      { icon: Globe, label: "Home Page Content", detail: "Edit 7 homepage sections: Hero Banner (heading, tagline, CTAs), Latest Brief, Trending Topics (5 tags), Featured Insight, AI Tool of the Week, Testimonials, and Quick Links" },
      { icon: BookOpen, label: "Vault Library", detail: "Manage 12+ vault items — set title, category, type, level, premium/free toggle, description, author, duration, and file attachments" },
      { icon: FileText, label: "Feed Posts", detail: "Create, edit, delete, and schedule feed posts with engagement tracking" },
      { icon: Upload, label: "File Uploads", detail: "Attach PDFs and images to any content section" },
    ],
    tips: [
      "Each content section shows a \"Last edited\" timestamp so you know when it was last updated.",
      "Click any section card to open the edit modal with all editable fields.",
      "Vault items support categories: AI Strategy, Governance, Digital Transformation, Cybersecurity, and more.",
    ],
  },
  {
    id: "events",
    title: "Events Management",
    icon: Vote,
    description: "Create, publish, and manage conference events with files, AI document parsing, and reports.",
    adminTab: "events",
    steps: [
      { icon: Plus, label: "Add Event", detail: "Click \"+ Add Event\" to create a new event with title, date, location, conference details, timezone, and optional access code" },
      { icon: Globe, label: "Web Link", detail: "Open the event's public-facing page to preview what attendees see" },
      { icon: Star, label: "Feature Event", detail: "Pin one event as the featured event — it appears on the homepage with a live countdown timer. Only one event can be featured at a time." },
      { icon: Pencil, label: "Edit Event", detail: "Modify event details including title, dates, location, slug, access code, display settings, and seminar mode" },
      { icon: Upload, label: "Upload Files", detail: "Expand an event to attach files (PDF, PPT, DOC, XLS, TXT — up to 50MB each). These are downloadable by attendees." },
      { icon: Zap, label: "AI Document Parse", detail: "Upload a conference schedule PDF/DOC and let AI automatically extract event details — supports multiple events per document" },
      { icon: Trash2, label: "Delete Event", detail: "Remove an event permanently (with confirmation prompt)" },
    ],
    tips: [
      "Events are split into \"Current Events\" (future dates) and \"Previous Events\" (past dates).",
      "The gold star icon marks the currently featured event. Click the star on another event to switch.",
      "Supports 7 US timezones: Eastern, Central, Mountain, Pacific, Arizona, Alaska, and Hawaii.",
      "File uploads are stored in Supabase and served via secure signed URLs.",
    ],
  },
  {
    id: "conference",
    title: "Conference Tools",
    icon: BarChart3,
    description: "Real-time audience engagement — manage sessions, polls, Q&A, word clouds, and announcements for live events.",
    adminTab: "conference",
    steps: [
      { icon: Eye, label: "Select an Event", detail: "The Conference tab shows all your events. Click any event card to drill into its interactive tools." },
      { icon: Power, label: "Go LIVE", detail: "Toggle the LIVE switch (top-right) to enable all interactive tools for attendees. Green = active." },
      { icon: ArrowLeft, label: "Back to Events", detail: "Click the back arrow to return to the event list and select a different event" },
    ],
    tips: [
      "The \"Engagement OFF\" status bar at the top shows when no events are currently live.",
      "Events with sessions show a blue badge with the session count.",
    ],
    subSections: [
      {
        id: "sessions",
        title: "Sessions",
        icon: Radio,
        description: "Add and manage individual sessions within an event. Each session gets its own polls, Q&A, and toggle.",
        steps: [
          { icon: Plus, label: "Add Session", detail: "Create sessions with title, description, speaker name, room location, and time" },
          { icon: Zap, label: "Auto-Fetch Schedule", detail: "Toggle to automatically sync the session schedule from the web every 7 days via n8n automation" },
          { icon: MessageSquare, label: "Q&A Toggle", detail: "Enable or disable Q&A per session (red = off, green = on). When off, attendees cannot submit questions." },
          { icon: Eye, label: "Release Controls", detail: "\"Show All\" makes all sessions visible, \"Single Release\" shows one at a time, \"Hide All\" hides everything from attendees" },
        ],
        tips: ["Sessions are displayed to attendees in the order they are created."],
      },
      {
        id: "polls",
        title: "Live Polling",
        icon: BarChart3,
        description: "Create polls, deploy them live, and view real-time results.",
        steps: [
          { icon: Plus, label: "Create Poll", detail: "Enter a question and 2+ answer options. Click \"Create Poll (Queued)\" to save it." },
          { icon: Upload, label: "Batch Import", detail: "Switch to \"Batch\" tab to upload a CSV or document with multiple polls. Also supports .pdf, .doc, .xls files." },
          { icon: PlayCircle, label: "Deploy Live", detail: "Push a queued poll live so attendees can see it and vote in real-time" },
          { icon: Filter, label: "Filter by Session", detail: "Use the session dropdown to view polls for a specific session only" },
          { icon: Download, label: "Export Results", detail: "Download poll results as CSV for reporting and post-event analysis" },
        ],
        tips: [
          "Polls update in real-time via WebSocket — results appear instantly as attendees vote.",
          "You can deploy multiple polls at once or release them one at a time for pacing.",
        ],
      },
      {
        id: "qa",
        title: "Q&A Moderation",
        icon: MessageSquare,
        description: "Review, approve, and manage audience questions during live events.",
        steps: [
          { icon: Eye, label: "Approve / Hide", detail: "Control which questions are visible to the audience. Hidden questions are only seen by admins." },
          { icon: Star, label: "Mark Answered", detail: "Flag questions that have been addressed by the speaker" },
          { icon: FileText, label: "Archive", detail: "Move old questions to the archive tab for record-keeping" },
          { icon: Trash2, label: "Delete", detail: "Remove questions permanently" },
        ],
        tips: [
          "Questions update in real-time via WebSocket — no need to refresh.",
          "Questions are ranked by upvote count so you can see what the audience cares about most.",
        ],
      },
      {
        id: "wordcloud",
        title: "Word Cloud",
        icon: Cloud,
        description: "See what words and phrases attendees are submitting in real-time.",
        steps: [
          { icon: Eye, label: "Live View", detail: "Words appear as attendees type them, sized proportionally by frequency" },
          { icon: Trash2, label: "Delete Entries", detail: "Remove individual inappropriate or off-topic words" },
          { icon: Trash2, label: "Clear All", detail: "Reset the entire word cloud with a confirmation prompt" },
        ],
      },
      {
        id: "announcements",
        title: "Announcements",
        icon: Megaphone,
        description: "Broadcast messages to all event attendees in real-time.",
        steps: [
          { icon: Plus, label: "Send Announcement", detail: "Enter a title and message, then broadcast to all attendees instantly" },
          { icon: Power, label: "Toggle Active", detail: "Turn announcements on/off without deleting them" },
          { icon: Trash2, label: "Delete", detail: "Remove announcements permanently when no longer needed" },
        ],
      },
      {
        id: "settings",
        title: "Settings",
        icon: Shield,
        description: "Manage roles, profanity filters, and the master engagement toggle.",
        steps: [
          { icon: UserPlus, label: "Role Manager", detail: "Assign admin, moderator, or presenter roles to users by email. Moderators can approve Q&A questions." },
          { icon: Shield, label: "Profanity Filter", detail: "Add custom terms to the blocklist. View a log of when and where violations occurred." },
          { icon: Power, label: "Seminar Mode", detail: "Master toggle for all interactive tools (polls, Q&A, word cloud, sessions). Same as the LIVE switch." },
        ],
        tips: ["Moderators can approve Q&A questions but cannot create events or manage users."],
      },
    ],
  },
  {
    id: "inquiries",
    title: "Inquiries",
    icon: Inbox,
    description: "Track and respond to booking and consultation requests from the website.",
    adminTab: "inquiries",
    steps: [
      { icon: Search, label: "Search", detail: "Find inquiries by name or email address" },
      { icon: Filter, label: "Filter by Type", detail: "Booking, Consultation, or All" },
      { icon: Filter, label: "Filter by Status", detail: "New → Reviewed → Contacted → Archived. Update status with one click." },
      { icon: Eye, label: "View Details", detail: "Click any inquiry to see the full message, contact info, phone, and organization" },
    ],
    tips: [
      "The blue badge on the Inquiries tab shows the count of unread inquiries.",
      "Workflow: New → Reviewed → Contacted → Archived. Move inquiries through each stage as you handle them.",
      "20 inquiries per page with pagination controls.",
    ],
  },
  {
    id: "notifications",
    title: "Push Notifications",
    icon: Bell,
    description: "Send push notifications to users across web, iOS, and Android — and manage subscribers.",
    adminTab: "notifications",
    steps: [
      { icon: Users, label: "Subscriber Stats", detail: "View total subscriber count with breakdown by platform: Web Push, iOS, and Android" },
      { icon: Megaphone, label: "Compose Notification", detail: "Enter a title, body text, and optional URL link (e.g. /vault, /assessments). Choose to broadcast to all or target a specific user." },
      { icon: Zap, label: "Send", detail: "Tap Send to deliver instantly. You'll see a confirmation with devices reached and any failures." },
      { icon: Eye, label: "Subscriber List", detail: "Browse all active subscribers with platform indicators, name, email, and subscription date" },
    ],
    tips: [
      "Push notifications work on web browsers, iOS (Safari), and Android devices.",
      "Use the URL field to deep-link users directly to a page when they tap the notification.",
      "The subscriber list refreshes when you click the Refresh button.",
    ],
  },
  {
    id: "presentations",
    title: "Presentations",
    icon: ClipboardCheck,
    description: "Upload and manage downloadable presentation materials for your audience.",
    adminTab: "presentations",
    steps: [
      { icon: Plus, label: "Create Presentation", detail: "Add a title, description, and category for a new presentation" },
      { icon: Upload, label: "Upload Files", detail: "Attach PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, or TXT files (50MB max per file)" },
      { icon: Eye, label: "Publish / Unpublish", detail: "Toggle visibility — unpublished presentations are hidden from attendees" },
      { icon: Trash2, label: "Delete", detail: "Remove presentations or individual files" },
    ],
    tips: [
      "Published presentations appear in the public Vault section of the website.",
      "Click the expand arrow on any presentation to see and manage its attached files.",
    ],
  },
  {
    id: "users",
    title: "User Management",
    icon: Users,
    description: "Search, disable, change roles, and delete users from your admin dashboard.",
    adminTab: "users",
    steps: [
      { icon: Search, label: "Search Users", detail: "Type in the search bar to find users by name or organization. Results filter as you type." },
      { icon: Filter, label: "Filter by Tier", detail: "Use the dropdown to show only Free, Pro, or Executive users. Each tier has a color-coded badge." },
      { icon: Eye, label: "User Cards", detail: "Each user appears on a card showing their name, email, organization, subscription tier, role, and join date." },
      { icon: Power, label: "Disable a User", detail: "Click the \"Disable\" button on any user card. They will not be able to sign in. Click \"Re-enable\" to restore access." },
      { icon: Shield, label: "Change Role", detail: "Click \"Change Role\" to assign User, Moderator, or Admin. Moderators can manage conference tools. Admins get full dashboard access." },
      { icon: Trash2, label: "Delete a User", detail: "Click \"Delete\" to permanently disable the account and remove personal data. This cannot be undone — use Disable first if you might want to restore access later." },
    ],
    tips: [
      "The owner account (Keith) is always protected — it cannot be disabled, deleted, or have its role changed.",
      "You cannot disable or delete your own account from the admin panel.",
      "Disabled users appear dimmed with a red \"Account Disabled\" badge. They can be re-enabled at any time.",
      "Deleting a user is permanent — their data is anonymized and they cannot be restored. Always try Disable first.",
      "Users are sorted by creation date (newest first). 20 per page with pagination.",
    ],
  },
  {
    id: "content",
    title: "Content Analytics",
    icon: BotMessageSquare,
    description: "View assessment results, vault content metrics, and strategy room activity — with charts and filtering.",
    adminTab: "content",
    steps: [
      { icon: BarChart3, label: "Stat Cards", detail: "See totals for Vault Content, Assessments Completed, and Active Strategy Rooms at a glance" },
      { icon: BarChart3, label: "Assessment Charts", detail: "Line chart of completions over 30 days, plus breakdowns by assessment type and vault content type" },
      { icon: Search, label: "Search Results", detail: "Find assessment results by user name" },
      { icon: Filter, label: "Filter by Type", detail: "Leadership (LPAI), Strategic Vision (FPAI), and other assessment types" },
      { icon: Eye, label: "Score Badges", detail: "Scores are color-coded: Green (70%+), Yellow (40–69%), Red (below 40%)" },
      { icon: Trash2, label: "Delete", detail: "Remove individual results or bulk-delete all results (requires typing \"RESET\" to confirm)" },
    ],
    tips: [
      "Score color coding makes it easy to spot users who may need follow-up coaching.",
      "The bulk delete in the Tools tab requires typing RESET as a safety measure.",
    ],
  },
  {
    id: "revenue",
    title: "Revenue",
    icon: DollarSign,
    description: "Track subscription revenue, conversion rates, and the signup-to-paid funnel.",
    adminTab: "revenue",
    steps: [
      { icon: DollarSign, label: "MRR Card", detail: "Monthly Recurring Revenue displayed in dollars — your key revenue metric" },
      { icon: Users, label: "Paid Subscriptions", detail: "Total count of paying subscribers (Pro + Executive)" },
      { icon: TrendingUp, label: "Conversion Rate", detail: "Percentage of total users who have upgraded to a paid plan" },
      { icon: BarChart3, label: "Subscription Conversions", detail: "Line chart showing new paid subscriptions over the last 30 days" },
      { icon: BarChart3, label: "Tier Breakdown", detail: "Pie chart showing distribution across Free, Pro, and Executive tiers" },
      { icon: BarChart3, label: "Conversion Funnel", detail: "Bar chart showing Total Signups → Free → Pro → Executive with percentages at each stage" },
    ],
    tips: [
      "The conversion funnel shows exactly where users drop off — use it to identify where to focus marketing efforts.",
      "MRR updates in real-time based on active Stripe subscriptions.",
    ],
  },
  {
    id: "tools",
    title: "Tools (Danger Zone)",
    icon: Lock,
    description: "Admin-only destructive actions — handle with care.",
    adminTab: "tools",
    steps: [
      { icon: Trash2, label: "Reset All Assessments", detail: "Permanently deletes ALL assessment results. You must type \"RESET\" to confirm — this cannot be undone." },
    ],
    tips: [
      "This tab is intentionally minimal. Destructive actions require explicit confirmation.",
      "Only use this when you need a complete fresh start on assessment data.",
    ],
  },
];

// ------------------------------------------------------------
// Workflow cards
// ------------------------------------------------------------

const WORKFLOWS = [
  {
    title: "Before a Conference",
    emoji: "🎯",
    steps: [
      "Create event in Events tab",
      "Feature it (star icon) for homepage countdown",
      "Conference tab → select event → Add sessions",
      "Create polls for each session",
      "Test with access code",
    ],
  },
  {
    title: "Going Live",
    emoji: "🔴",
    steps: [
      "Conference tab → select event",
      "Toggle LIVE switch (top-right) to ON",
      "Deploy polls one at a time",
      "Monitor Q&A — approve questions",
      "Send announcements as needed",
    ],
  },
  {
    title: "After the Event",
    emoji: "📊",
    steps: [
      "Toggle LIVE to OFF",
      "Export poll results (CSV)",
      "Review Q&A archive",
      "Check Revenue tab for conversions",
    ],
  },
  {
    title: "Managing Inquiries",
    emoji: "💬",
    steps: [
      "Check Inquiries tab (blue badge = unread)",
      "Click inquiry to view details",
      "Update status: New → Reviewed → Contacted → Archived",
    ],
  },
  {
    title: "Uploading Presentations",
    emoji: "📑",
    steps: [
      "Presentations tab → Create new",
      "Set title, description, category",
      "Upload files (PDF, PPT, DOC)",
      "Toggle \"Published\" when ready",
    ],
  },
  {
    title: "Adding a Moderator",
    emoji: "🛡️",
    steps: [
      "Conference tab → select event",
      "Settings sub-tab → Role Manager",
      "Enter email → Assign \"moderator\" role",
      "They can now approve Q&A questions",
    ],
  },
  {
    title: "Updating Homepage Content",
    emoji: "✏️",
    steps: [
      "Content (Manager) tab",
      "Click \"Home Page\" section",
      "Select section to edit (Hero, Brief, Topics, etc.)",
      "Update text, links, or images in the modal",
      "Save — changes go live immediately",
    ],
  },
  {
    title: "Sending a Push Notification",
    emoji: "🔔",
    steps: [
      "Notifications tab",
      "Enter title and body text",
      "Optional: add a URL to deep-link users",
      "Choose Broadcast (all) or target a user",
      "Tap Send — check delivery confirmation",
    ],
  },
  {
    title: "Customizing the App",
    emoji: "🎨",
    steps: [
      "Customize tab",
      "Adjust brand colors with color pickers",
      "Toggle features on/off (min 3 required)",
      "Reorder homepage sections by dragging",
      "Save changes with confirmation",
    ],
  },
  {
    title: "Requesting a Site Change",
    emoji: "📩",
    steps: [
      "Click \"Request Update\" (top-right header)",
      "Select affected section and change type",
      "Describe the current vs. desired state",
      "Set priority (Low / Medium / High)",
      "Submit — Tim receives it immediately",
    ],
  },
];

// ------------------------------------------------------------
// Visual tab map data
// ------------------------------------------------------------

const TAB_MAP: { id: string; label: string; icon: React.ElementType; color: string; category: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, color: "#2764FF", category: "Analytics" },
  { id: "customize", label: "Customize", icon: Paintbrush, color: "#C8A84E", category: "Settings" },
  { id: "content-manager", label: "Content", icon: FileEdit, color: "#21B8CD", category: "Content" },
  { id: "events", label: "Events", icon: Vote, color: "#6ECF55", category: "Events" },
  { id: "conference", label: "Conference", icon: BarChart3, color: "#8840FF", category: "Events" },
  { id: "inquiries", label: "Inquiries", icon: Inbox, color: "#2764FF", category: "Communication" },
  { id: "notifications", label: "Notifications", icon: Bell, color: "#F77A81", category: "Communication" },
  { id: "presentations", label: "Presentations", icon: ClipboardCheck, color: "#C8A84E", category: "Content" },
  { id: "users", label: "Users", icon: Users, color: "#21B8CD", category: "Management" },
  { id: "content", label: "Analytics", icon: BotMessageSquare, color: "#8840FF", category: "Analytics" },
  { id: "revenue", label: "Revenue", icon: DollarSign, color: "#6ECF55", category: "Analytics" },
  { id: "tools", label: "Tools", icon: Lock, color: "#F77A81", category: "Settings" },
];

// ------------------------------------------------------------
// Animation variants
// ------------------------------------------------------------

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

// Audio file mapping — generated by scripts/generate-training-audio.ts
const AUDIO_MAP: Record<string, string> = {
  "getting-started": "/training/audio/getting-started.mp3",
  "overview": "/training/audio/overview.mp3",
  "customize": "/training/audio/customize.mp3",
  "content-manager": "/training/audio/content-manager.mp3",
  "events": "/training/audio/events.mp3",
  "conference": "/training/audio/conference.mp3",
  "inquiries": "/training/audio/inquiries.mp3",
  "notifications": "/training/audio/notifications.mp3",
  "presentations": "/training/audio/presentations.mp3",
  "users": "/training/audio/users.mp3",
  "content": "/training/audio/content-analytics.mp3",
  "revenue": "/training/audio/revenue.mp3",
  "tools": "/training/audio/tools.mp3",
};

export default function TrainingPage() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "guide" | "workflows">("map");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [playingSection, setPlayingSection] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
    setExpandedSub(null);
  };

  const toggleSub = (id: string) => {
    setExpandedSub(expandedSub === id ? null : id);
  };

  const playAudio = (sectionId: string) => {
    // Stop current audio
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
      audioRef.onended = null;
      audioRef.ontimeupdate = null;
    }

    if (playingSection === sectionId) {
      setPlayingSection(null);
      setAudioRef(null);
      setAudioProgress(0);
      return;
    }

    const src = AUDIO_MAP[sectionId];
    if (!src) return;

    const audio = new Audio(src);
    audio.onended = () => {
      setPlayingSection(null);
      setAudioRef(null);
      setAudioProgress(0);
    };
    audio.ontimeupdate = () => {
      setAudioProgress(audio.currentTime);
    };
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };
    audio.play();
    setPlayingSection(sectionId);
    setAudioRef(audio);
  };

  return (
    <div className="min-h-screen bg-klo-dark">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-klo-dark/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-klo-text flex items-center gap-2">
              <BookOpen size={20} className="text-klo-gold" />
              Admin Training Guide
            </h1>
            <p className="text-xs text-klo-muted mt-0.5">
              Complete walkthrough of every admin function
            </p>
          </div>

          {/* Audio toggle */}
          <button
            onClick={() => {
              if (audioEnabled && audioRef) {
                audioRef.pause();
                audioRef.currentTime = 0;
                setPlayingSection(null);
                setAudioRef(null);
                setAudioProgress(0);
              }
              setAudioEnabled(!audioEnabled);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              audioEnabled
                ? "bg-klo-gold/10 border-klo-gold/20 text-klo-gold"
                : "bg-white/5 border-white/10 text-klo-muted"
            }`}
          >
            <Volume2 size={14} />
            {audioEnabled ? "Audio On" : "Audio Off"}
          </button>

          {/* View toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/50 border border-white/5">
            <button
              onClick={() => setView("map")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "map"
                  ? "bg-klo-slate text-klo-text shadow-md"
                  : "text-klo-muted hover:text-klo-text"
              }`}
            >
              <LayoutDashboard size={14} className="inline mr-1 -mt-0.5" />
              Map
            </button>
            <button
              onClick={() => setView("guide")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "guide"
                  ? "bg-klo-slate text-klo-text shadow-md"
                  : "text-klo-muted hover:text-klo-text"
              }`}
            >
              <BookOpen size={14} className="inline mr-1 -mt-0.5" />
              Guide
            </button>
            <button
              onClick={() => setView("workflows")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "workflows"
                  ? "bg-klo-slate text-klo-text shadow-md"
                  : "text-klo-muted hover:text-klo-text"
              }`}
            >
              <Lightbulb size={14} className="inline mr-1 -mt-0.5" />
              Workflows
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {view === "map" ? (
            <motion.div
              key="map"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeIn}
            >
              {/* Quick-start banner */}
              <div className="rounded-2xl border border-[#2764FF]/20 bg-[#2764FF]/5 p-6 mb-8">
                <h2 className="text-lg font-bold text-klo-text mb-2 flex items-center gap-2">
                  <PlayCircle size={20} className="text-[#2764FF]" />
                  Quick Start
                </h2>
                <p className="text-sm text-klo-muted leading-relaxed mb-4">
                  Your admin dashboard has <span className="text-klo-text font-semibold">12 tabs</span> organized into 5 categories.
                  Tap any tab below to jump to its detailed guide, or use the header buttons for Changelog, Request Update, and this Training Guide.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: ScrollText, label: "Changelog", desc: "Version history" },
                    { icon: Send, label: "Request Update", desc: "Submit changes" },
                    { icon: BookOpen, label: "Training Guide", desc: "This page" },
                    { icon: RefreshCw, label: "Refresh", desc: "Reload data" },
                  ].map((btn) => (
                    <div key={btn.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                      <btn.icon size={14} className="text-klo-gold" />
                      <div>
                        <div className="text-xs font-medium text-klo-text">{btn.label}</div>
                        <div className="text-[10px] text-klo-muted">{btn.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category groups */}
              {["Analytics", "Content", "Events", "Communication", "Management", "Settings"].map((category) => {
                const tabs = TAB_MAP.filter((t) => t.category === category);
                if (tabs.length === 0) return null;
                return (
                  <div key={category} className="mb-6">
                    <h3 className="text-xs font-semibold text-klo-muted uppercase tracking-wider mb-3 px-1">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const section = TRAINING_SECTIONS.find(
                          (s) => s.adminTab === tab.id || s.id === tab.id
                        );
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setView("guide");
                              setTimeout(() => {
                                const sectionId = section?.id || tab.id;
                                setExpandedSection(sectionId);
                                document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }, 100);
                            }}
                            className="group flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-klo-surface hover:bg-white/[0.04] transition-all text-left"
                          >
                            <div
                              className="p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110"
                              style={{ backgroundColor: `${tab.color}15` }}
                            >
                              <Icon size={20} style={{ color: tab.color }} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-klo-text group-hover:text-white transition-colors">
                                {tab.label}
                              </div>
                              {section && (
                                <p className="text-xs text-klo-muted mt-0.5 line-clamp-2">
                                  {section.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-klo-muted group-hover:text-klo-gold transition-colors">
                                <span>View guide</span>
                                <ChevronRight size={10} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : view === "guide" ? (
            <motion.div
              key="guide"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeIn}
              className="space-y-3"
            >
              {TRAINING_SECTIONS.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  expanded={expandedSection === section.id}
                  onToggle={() => toggleSection(section.id)}
                  expandedSub={expandedSub}
                  onToggleSub={toggleSub}
                  onNavigate={(tab) => router.push(`/admin?tab=${tab}`)}
                  hasAudio={audioEnabled && !!AUDIO_MAP[section.id]}
                  isPlaying={playingSection === section.id}
                  audioProgress={playingSection === section.id ? audioProgress : 0}
                  audioDuration={playingSection === section.id ? audioDuration : 0}
                  onPlayAudio={() => playAudio(section.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="workflows"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeIn}
            >
              <p className="text-klo-muted mb-6 text-sm">
                Step-by-step guides for the most common admin tasks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WORKFLOWS.map((wf) => (
                  <div
                    key={wf.title}
                    className="rounded-2xl border border-white/5 bg-klo-surface p-6 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{wf.emoji}</span>
                      <h3 className="text-lg font-semibold text-klo-text">{wf.title}</h3>
                    </div>
                    <ol className="space-y-2.5">
                      {wf.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-5 h-5 rounded-full bg-klo-gold/15 text-klo-gold text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-klo-text/90">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Section Card
// ------------------------------------------------------------

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SectionCard({
  section,
  expanded,
  onToggle,
  expandedSub,
  onToggleSub,
  onNavigate,
  hasAudio,
  isPlaying,
  audioProgress,
  audioDuration,
  onPlayAudio,
}: {
  section: TrainingSection;
  expanded: boolean;
  onToggle: () => void;
  expandedSub: string | null;
  onToggleSub: (id: string) => void;
  onNavigate: (tab: string) => void;
  hasAudio: boolean;
  isPlaying: boolean;
  audioProgress: number;
  audioDuration: number;
  onPlayAudio: () => void;
}) {
  const Icon = section.icon;

  return (
    <div id={`section-${section.id}`} className="rounded-2xl border border-white/5 bg-klo-surface overflow-hidden scroll-mt-24">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="p-2.5 rounded-xl bg-klo-gold/10 shrink-0">
          <Icon size={20} className="text-klo-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-klo-text">{section.title}</h3>
          <p className="text-sm text-klo-muted mt-0.5 line-clamp-1">{section.description}</p>
        </div>
        {section.adminTab && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(section.adminTab!); }}
            className="shrink-0 text-xs font-medium text-klo-gold bg-klo-gold/10 hover:bg-klo-gold/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Open Tab →
          </button>
        )}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-klo-muted"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Audio narration player */}
              {hasAudio && (
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isPlaying
                    ? "bg-klo-gold/10 border-klo-gold/20"
                    : "bg-white/[0.02] border-white/5"
                }`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPlayAudio(); }}
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isPlaying
                        ? "bg-klo-gold text-black"
                        : "bg-klo-gold/20 text-klo-gold hover:bg-klo-gold/30"
                    }`}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Volume2 size={13} className="text-klo-gold shrink-0" />
                      <span className="text-xs font-medium text-klo-text">
                        {isPlaying ? "Playing narration..." : "Listen to this section"}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-klo-gold transition-all duration-300"
                          style={{ width: audioDuration > 0 ? `${(audioProgress / audioDuration) * 100}%` : "0%" }}
                        />
                      </div>
                      {audioDuration > 0 && (
                        <span className="text-[10px] text-klo-muted shrink-0 tabular-nums">
                          {formatTime(audioProgress)} / {formatTime(audioDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-2.5">
                {section.steps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                        <StepIcon size={14} className="text-klo-gold" />
                      </div>
                      <div>
                        <span className="font-medium text-klo-text">{step.label}</span>
                        <span className="text-klo-muted"> — {step.detail}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tips */}
              {section.tips && section.tips.length > 0 && (
                <div className="rounded-xl bg-[#2764FF]/5 border border-[#2764FF]/10 p-4 space-y-2">
                  <div className="text-xs font-semibold text-[#2764FF] flex items-center gap-1.5">
                    <Lightbulb size={13} />
                    Tips
                  </div>
                  {section.tips.map((tip, i) => (
                    <p key={i} className="text-sm text-[#7eb0ff] leading-relaxed">{tip}</p>
                  ))}
                </div>
              )}

              {/* Sub-sections (for Conference) */}
              {section.subSections && section.subSections.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-klo-muted uppercase tracking-wider mb-3">
                    Sub-sections
                  </div>
                  {section.subSections.map((sub) => (
                    <SubSectionCard
                      key={sub.id}
                      sub={sub}
                      expanded={expandedSub === sub.id}
                      onToggle={() => onToggleSub(sub.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------
// Sub-section Card (for conference drill-down)
// ------------------------------------------------------------

function SubSectionCard({
  sub,
  expanded,
  onToggle,
}: {
  sub: TrainingSubSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = sub.icon;

  return (
    <div className="rounded-xl border border-white/5 bg-klo-dark/40 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <Icon size={15} className="text-klo-gold shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-klo-text">{sub.title}</span>
          <span className="text-xs text-klo-muted ml-2">{sub.description}</span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-klo-muted shrink-0"
        >
          <ChevronRight size={14} />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="border-t border-white/5" />
              <div className="space-y-2">
                {sub.steps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                        <StepIcon size={12} className="text-klo-gold" />
                      </div>
                      <div>
                        <span className="font-medium text-klo-text">{step.label}</span>
                        <span className="text-klo-muted"> — {step.detail}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sub.tips && sub.tips.length > 0 && (
                <div className="rounded-lg bg-[#2764FF]/5 border border-[#2764FF]/10 p-3">
                  {sub.tips.map((tip, i) => (
                    <p key={i} className="text-xs text-[#7eb0ff] leading-relaxed">{tip}</p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
