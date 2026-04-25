import type {
  NavigationItem,
  Service,
  Assessment,
  SubscriptionTier,
  Affiliation,
} from "@/types";

// ============================================================
// AI Advisor System Prompt
// ============================================================

export const AI_ADVISOR_SYSTEM_PROMPT = `You are the KLO AI Strategic Advisor — speaking on behalf of Keith L. Odom.

Keith's verified background:
- CEO & Solution Architect, Axtegrity Consulting (Gold Certified Microsoft Partner)
- Director of Technology, Church of God in Christ, Inc. (COGIC)
- Founder & Lead Pastor, The Place of Grace Church, Orlando, FL
- CEO & Founder, TechChurch
- Founder, Church & Technology Summit
- Former Senior Fiscal Officer (Controller), MIT Media Lab
- 25+ years ministry experience, 20+ years business management

Your expertise areas:
- Enterprise IT strategy, ERP consulting, cloud solutions, digital transformation
- AI adoption and responsible AI governance
- Cybersecurity risk management and compliance
- Church and ministry technology modernization
- Custom software development and infrastructure management

Guidelines:
1. Give clear, actionable advice grounded in industry best practices.
2. Be respectful of faith traditions while delivering practical technology guidance.
3. Reference frameworks where appropriate (NIST, COBIT, TOGAF).
4. Keep responses concise and focused — avoid unnecessary preamble.
5. If something is outside your expertise, say so and suggest next steps.
6. Tone: warm yet authoritative, knowledgeable but approachable.`;

// ============================================================
// Navigation
// ============================================================

export const NAV_ITEMS: NavigationItem[] = [
  { label: "Home", href: "/", icon: "Home" },
  { label: "Assessments", href: "/assessments", icon: "ClipboardCheck" },
  { label: "Vault", href: "/vault", icon: "Lock", requiresAuth: true },
  { label: "Advisor", href: "/advisor", icon: "BotMessageSquare", requiresAuth: true },
  { label: "Strategy Rooms", href: "/strategy-rooms", icon: "LayoutDashboard", requiresAuth: true },
  { label: "Booking", href: "/booking", icon: "Mic" },
];

export const MOBILE_NAV_ITEMS: NavigationItem[] = [
  { label: "Home", href: "/", icon: "Home" },
  { label: "Advisor", href: "/advisor", icon: "BotMessageSquare", requiresAuth: true },
  { label: "Assess", href: "/assessments", icon: "ClipboardCheck" },
  { label: "Vault", href: "/vault", icon: "Lock", requiresAuth: true },
  { label: "Booking", href: "/booking", icon: "Mic" },
];

// ============================================================
// Services
// ============================================================

export const SERVICES: Service[] = [
  {
    title: "IT Consulting",
    description:
      "End-to-end technology advisory services for organizations seeking to modernize infrastructure, optimize operations, and align IT strategy with business objectives.",
    icon: "Monitor",
    features: [
      "Infrastructure assessment & roadmap",
      "Cloud migration strategy",
      "Vendor evaluation & selection",
      "IT budget optimization",
    ],
  },
  {
    title: "CTO Services",
    description:
      "Fractional and interim CTO leadership for startups, churches, and mid-market organizations that need senior technology vision without the full-time overhead.",
    icon: "BrainCircuit",
    features: [
      "Technology vision & roadmap",
      "Team structure & hiring strategy",
      "Architecture review & governance",
      "Board-level technology reporting",
    ],
  },
  {
    title: "Project Management",
    description:
      "Disciplined project and program management to deliver complex technology initiatives on time, on budget, and aligned with stakeholder expectations.",
    icon: "FolderKanban",
    features: [
      "Agile & hybrid delivery",
      "Risk & issue management",
      "Stakeholder communication",
      "Post-implementation review",
    ],
  },
  {
    title: "Conference Speaking",
    description:
      "Dynamic keynotes and breakout sessions at the intersection of technology, leadership, and faith — delivered with clarity, energy, and real-world insight.",
    icon: "Mic",
    features: [
      "Technology leadership keynotes",
      "AI & digital transformation talks",
      "Church technology workshops",
      "Custom topic development",
    ],
  },
];

// ============================================================
// Affiliations
// ============================================================

export const AFFILIATIONS: Affiliation[] = [
  {
    name: "The Place of Grace Church",
    role: "Founder & Lead Pastor",
  },
  {
    name: "Church of God in Christ, Inc.",
    role: "Director of Technology",
  },
  {
    name: "Axtegrity Consulting",
    role: "CEO & Solution Architect",
  },
  {
    name: "TechChurch",
    role: "CEO & Founder",
  },
  {
    name: "Church & Technology Summit",
    role: "Founder",
  },
];

// ============================================================
// Subscription Tiers
// ============================================================

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    slug: "free",
    name: "Explorer",
    price: 0,
    interval: "month",
    description:
      "Get started with foundational assessments and a taste of the KLO ecosystem.",
    features: [
      "Church Readiness Assessment",
      "AI Readiness Assessment",
      "Community feed access",
      "Limited Vault previews",
    ],
    cta: "Get Started",
  },
  {
    slug: "pro",
    name: "Pro",
    price: 29,
    interval: "month",
    description:
      "Unlock the full assessment suite, Vault content library, and AI Advisor conversations.",
    features: [
      "All assessments with detailed reports",
      "Full Vault content library",
      "AI Advisor (50 messages/month)",
      "Community feed & discussions",
      "Monthly strategy newsletter",
    ],
    highlighted: true,
    cta: "Join Now",
  },
  {
    slug: "executive",
    name: "Executive",
    price: 99,
    interval: "month",
    description:
      "Elite access with unlimited AI advisory, private Strategy Rooms, and direct consulting priority.",
    features: [
      "Everything in Pro",
      "Unlimited AI Advisor access",
      "Private Strategy Rooms",
      "Priority consulting requests",
      "Exclusive executive Vault content",
      "Quarterly 1-on-1 strategy call",
    ],
    cta: "Go Executive",
  },
];

// ============================================================
// Assessments
// ============================================================

export const ASSESSMENTS: Assessment[] = [
  {
    id: "church-readiness",
    title: "Church Readiness",
    description:
      "Evaluate your church or ministry's technology maturity across infrastructure, communication, digital engagement, and data management.",
    icon: "Church",
    href: "/assessments/church-readiness",
    questionCount: 10,
    estimatedMinutes: 5,
    category: "Ministry",
  },
  {
    id: "ai-readiness",
    title: "AI Readiness",
    description:
      "Determine your organization's preparedness to adopt and leverage artificial intelligence, from data foundations to culture and governance.",
    icon: "BrainCircuit",
    href: "/assessments/ai-readiness",
    questionCount: 10,
    estimatedMinutes: 5,
    category: "Technology",
  },
  {
    id: "governance",
    title: "Technology Governance",
    description:
      "Assess the strength of your IT governance framework including policies, compliance, change management, and strategic alignment.",
    icon: "ShieldCheck",
    href: "/assessments/governance",
    questionCount: 10,
    estimatedMinutes: 5,
    category: "Governance",
  },
  {
    id: "cyber-risk",
    title: "Cyber Risk",
    description:
      "Identify vulnerabilities and measure your organization's cyber risk posture across people, process, and technology dimensions.",
    icon: "ShieldAlert",
    href: "/assessments/cyber-risk",
    questionCount: 10,
    estimatedMinutes: 5,
    category: "Security",
  },
];

// ============================================================
// Misc Constants
// ============================================================

export const SITE_NAME = "KLO";
export const SITE_DESCRIPTION =
  "Keith L. Odom — Technology Innovator, Conference Speaker, and Pastor. Strategic technology leadership at the intersection of innovation and faith.";
export const SITE_URL = "https://keithlodom.io";

export const CONTACT_EMAIL = "info@keithlodom.io";

/** Admin-only navigation item — shown conditionally based on user role. */
export const ADMIN_NAV_ITEM: NavigationItem = {
  label: "Admin",
  href: "/admin",
  icon: "ShieldCheck",
  requiresAuth: true,
};

// ============================================================
// Push notification opt-in
// ============================================================
// Bump this any time we want every existing user (web + native) to be
// re-asked once whether they'd like push notifications. The client compares
// it against localStorage["klo-push-prompt-version"]; mismatch forces the
// pre-prompt modal to show one time, even for users who previously declined
// or dismissed. App-store updates should bump this in the same release that
// ships them so updaters are reconfirmed on first launch.
export const PUSH_PROMPT_VERSION = 2;
export const PUSH_PROMPT_VERSION_KEY = "klo-push-prompt-version";
// Wait this long after auth before we ask, so the prompt lands after the
// user has actually seen the product (first meaningful interaction).
export const PUSH_PROMPT_DEFER_MS = 12_000;
