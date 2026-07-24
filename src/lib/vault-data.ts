export interface EventFile {
  id: string;
  name: string;
  type: "pdf" | "doc" | "docx" | "xls" | "xlsx" | "txt";
  url: string;
  size: string;
}

export interface VaultItem {
  id: string;
  title: string;
  slug: string;
  category: VaultCategory;
  level: VaultLevel;
  type: VaultType;
  isPremium: boolean;
  thumbnailGradient: string;
  description: string;
  duration: string;
  publishedAt: string;
  /**
   * Raw DB created_at, when known. Optional because the static seed array
   * below and other VaultItem producers (vault-events.ts) don't have a
   * real creation timestamp — only /api/content/vault populates this.
   * Consumers that need "most recently added" ordering (Vault Featured
   * section) should fall back to publishedAt when this is absent.
   */
  createdAt?: string;
  author: string;
  conferenceName?: string;
  conferenceLocation?: string;
  files?: EventFile[];
}

export type VaultCategory =
  | "AI & Ethics"
  | "Church & Tech"
  | "Governance"
  | "Leadership"
  | "Youth & Workforce"
  | "Previous Events"
  | "Current Events";

export type VaultLevel = "Beginner" | "Intermediate" | "Executive";

export type VaultType =
  | "video"
  | "briefing"
  | "template"
  | "policy"
  | "framework"
  | "replay"
  | "event";

export const VAULT_CATEGORIES: VaultCategory[] = [
  "AI & Ethics",
  "Church & Tech",
  "Governance",
  "Leadership",
  "Youth & Workforce",
  "Previous Events",
  "Current Events",
];

export const VAULT_LEVELS: VaultLevel[] = [
  "Beginner",
  "Intermediate",
  "Executive",
];

export const VAULT_TYPES: VaultType[] = [
  "video",
  "briefing",
  "template",
  "policy",
  "framework",
  "replay",
  "event",
];

const gradients = [
  "from-amber-600 to-orange-800",
  "from-blue-600 to-indigo-900",
  "from-emerald-600 to-teal-900",
  "from-purple-600 to-violet-900",
  "from-rose-600 to-pink-900",
  "from-cyan-600 to-blue-900",
  "from-yellow-600 to-amber-900",
  "from-fuchsia-600 to-purple-900",
];

export const vaultItems: VaultItem[] = [
  {
    id: "v-001",
    title: "The Pastor's Guide to AI Adoption",
    slug: "pastors-guide-ai-adoption",
    category: "Church & Tech",
    level: "Beginner",
    type: "briefing",
    isPremium: false,
    thumbnailGradient: gradients[0],
    description:
      "A plain-language introduction to artificial intelligence for faith leaders. Learn what AI can and cannot do, how to evaluate tools for your ministry, and how to communicate change to your congregation with clarity and confidence.",
    duration: "12 min read",
    publishedAt: "2026-02-15",
    author: "Keith L. Odom",
  },
  {
    id: "v-002",
    title: "Enterprise AI Governance Framework",
    slug: "enterprise-ai-governance-framework",
    category: "Governance",
    level: "Executive",
    type: "framework",
    isPremium: true,
    thumbnailGradient: gradients[1],
    description:
      "A comprehensive governance framework for organizations deploying AI at scale. Covers risk assessment matrices, accountability structures, audit protocols, and board-level reporting templates designed for enterprise leadership.",
    duration: "35 min read",
    publishedAt: "2026-02-10",
    author: "Keith L. Odom",
  },
  {
    id: "v-003",
    title: "Digital Ministry Playbook 2026",
    slug: "digital-ministry-playbook-2026",
    category: "Church & Tech",
    level: "Intermediate",
    type: "template",
    isPremium: true,
    thumbnailGradient: gradients[2],
    description:
      "A step-by-step operational playbook for churches ready to modernize their digital presence. Includes social media calendars, livestream checklists, CRM integration guides, and member engagement automation workflows.",
    duration: "28 min read",
    publishedAt: "2026-01-28",
    author: "Keith L. Odom",
  },
  {
    id: "v-004",
    title: "Cybersecurity Essentials for Churches",
    slug: "cybersecurity-essentials-churches",
    category: "AI & Ethics",
    level: "Beginner",
    type: "video",
    isPremium: false,
    thumbnailGradient: gradients[3],
    description:
      "Protect your ministry from data breaches, phishing attacks, and ransomware. This video covers the fundamentals of cybersecurity hygiene every church administrator needs to know, with real-world case studies and actionable checklists.",
    duration: "45 min video",
    publishedAt: "2026-01-20",
    author: "Keith L. Odom",
  },
  {
    id: "v-005",
    title: "Board-Level Technology Reporting Template",
    slug: "board-level-tech-reporting-template",
    category: "Leadership",
    level: "Executive",
    type: "template",
    isPremium: true,
    thumbnailGradient: gradients[4],
    description:
      "Present technology investments and digital transformation progress to your board with confidence. This template includes KPI dashboards, risk heat maps, ROI calculations, and narrative frameworks that translate technical progress into business language.",
    duration: "15 min read",
    publishedAt: "2026-01-15",
    author: "Keith L. Odom",
  },
  {
    id: "v-006",
    title: "AI Ethics in Youth Ministry",
    slug: "ai-ethics-youth-ministry",
    category: "Youth & Workforce",
    level: "Intermediate",
    type: "briefing",
    isPremium: true,
    thumbnailGradient: gradients[5],
    description:
      "Navigate the ethical complexities of deploying AI tools in youth-facing programs. Covers data privacy for minors, consent frameworks, algorithmic bias awareness, and building digital literacy into your youth curriculum.",
    duration: "18 min read",
    publishedAt: "2026-02-01",
    author: "Keith L. Odom",
  },
  {
    id: "v-007",
    title: "Leading Through Digital Disruption",
    slug: "leading-through-digital-disruption",
    category: "Leadership",
    level: "Intermediate",
    type: "video",
    isPremium: true,
    thumbnailGradient: gradients[6],
    description:
      "A masterclass on change management for leaders navigating technological transformation. Learn the psychological frameworks, communication strategies, and organizational design patterns that separate successful digital transformations from failed ones.",
    duration: "52 min video",
    publishedAt: "2026-01-08",
    author: "Keith L. Odom",
  },
  {
    id: "v-008",
    title: "Responsible AI Policy Starter Kit",
    slug: "responsible-ai-policy-starter-kit",
    category: "AI & Ethics",
    level: "Beginner",
    type: "policy",
    isPremium: false,
    thumbnailGradient: gradients[7],
    description:
      "Get your organization's AI policy off the ground with this comprehensive starter kit. Includes policy templates, acceptable use guidelines, vendor evaluation checklists, and incident response procedures ready for customization.",
    duration: "20 min read",
    publishedAt: "2026-02-05",
    author: "Keith L. Odom",
  },
  {
    id: "v-009",
    title: "Workforce Upskilling in the Age of AI",
    slug: "workforce-upskilling-age-of-ai",
    category: "Youth & Workforce",
    level: "Intermediate",
    type: "framework",
    isPremium: true,
    thumbnailGradient: gradients[0],
    description:
      "Equip your team with the skills to thrive alongside AI. This framework provides competency maps, training program blueprints, mentorship models, and measurement tools for organizations committed to building an AI-ready workforce.",
    duration: "25 min read",
    publishedAt: "2025-12-18",
    author: "Keith L. Odom",
  },
  {
    id: "v-010",
    title: "AI-Powered Community Engagement Strategies",
    slug: "ai-powered-community-engagement",
    category: "Church & Tech",
    level: "Intermediate",
    type: "replay",
    isPremium: true,
    thumbnailGradient: gradients[1],
    description:
      "Replay of a live workshop exploring how churches and nonprofits can leverage AI to deepen community engagement. Covers chatbot ministry tools, personalized outreach automation, and sentiment analysis for congregation feedback.",
    duration: "1h 15 min replay",
    publishedAt: "2025-12-10",
    author: "Keith L. Odom",
  },
  {
    id: "v-011",
    title: "Data Privacy Compliance for Faith Organizations",
    slug: "data-privacy-compliance-faith-orgs",
    category: "Governance",
    level: "Intermediate",
    type: "policy",
    isPremium: true,
    thumbnailGradient: gradients[2],
    description:
      "Navigate GDPR, CCPA, and sector-specific data privacy requirements for religious organizations. Includes compliance checklists, data mapping exercises, consent form templates, and breach notification procedures.",
    duration: "22 min read",
    publishedAt: "2025-11-25",
    author: "Keith L. Odom",
  },
  {
    id: "v-012",
    title: "The Executive's AI Briefing: Q1 2026",
    slug: "executives-ai-briefing-q1-2026",
    category: "Leadership",
    level: "Executive",
    type: "briefing",
    isPremium: true,
    thumbnailGradient: gradients[3],
    description:
      "A quarterly intelligence briefing for senior leaders. Covers the latest AI developments, regulatory changes, market shifts, and strategic recommendations. Designed to be consumed in one sitting and shared with your leadership team.",
    duration: "14 min read",
    publishedAt: "2026-01-05",
    author: "Keith L. Odom",
  },
  {
    id: "v-013",
    title: "Building an AI Advisory Council",
    slug: "building-ai-advisory-council",
    category: "Governance",
    level: "Executive",
    type: "framework",
    isPremium: false,
    thumbnailGradient: gradients[4],
    description:
      "A practical guide to establishing an internal AI advisory council. Covers member selection criteria, charter development, meeting cadence, decision-making frameworks, and how to balance innovation velocity with responsible oversight.",
    duration: "16 min read",
    publishedAt: "2026-02-20",
    author: "Keith L. Odom",
  },
  {
    id: "v-014",
    title: "Youth Tech Mentorship Program Blueprint",
    slug: "youth-tech-mentorship-blueprint",
    category: "Youth & Workforce",
    level: "Beginner",
    type: "template",
    isPremium: false,
    thumbnailGradient: gradients[5],
    description:
      "Launch a technology mentorship program for young people in your community. This blueprint includes curriculum outlines, mentor matching frameworks, progress tracking tools, and partnership templates for local tech companies.",
    duration: "19 min read",
    publishedAt: "2026-02-12",
    author: "Keith L. Odom",
  },
  {
    id: "v-015",
    title: "AI Risk Assessment for Nonprofit Leaders",
    slug: "ai-risk-assessment-nonprofit-leaders",
    category: "AI & Ethics",
    level: "Executive",
    type: "video",
    isPremium: true,
    thumbnailGradient: gradients[6],
    description:
      "A video deep-dive into identifying, quantifying, and mitigating AI-related risks for nonprofit organizations. Covers reputational risk, operational dependencies, vendor lock-in, and bias auditing methodologies with real-world examples.",
    duration: "38 min video",
    publishedAt: "2025-12-02",
    author: "Keith L. Odom",
  },
  {
    id: "v-016",
    title: "Smart Church Operations: Automation Guide",
    slug: "smart-church-operations-automation",
    category: "Church & Tech",
    level: "Beginner",
    type: "video",
    isPremium: false,
    thumbnailGradient: gradients[7],
    description:
      "Streamline your church operations with practical automation. This video walks through setting up automated visitor follow-ups, event management workflows, donation tracking, and volunteer scheduling using affordable tools.",
    duration: "33 min video",
    publishedAt: "2026-01-22",
    author: "Keith L. Odom",
  },
  {
    id: "v-017",
    title: "Navigating the Moral Frontier of Generative AI in Ministry",
    slug: "moral-frontier-gen-ai-ministry",
    category: "AI & Ethics",
    level: "Executive",
    type: "briefing",
    isPremium: true,
    thumbnailGradient: gradients[1],
    description:
      "A strategic framework for faith-based leaders navigating the ethical landscape of generative AI. Covers data stewardship as sacred trust, bias mitigation with theological integrity, and building congregational transparency in an age of automation.",
    duration: "20 min read",
    publishedAt: "2026-03-05",
    author: "Keith L. Odom",
  },
];

export function getVaultItemBySlug(slug: string): VaultItem | undefined {
  return vaultItems.find((item) => item.slug === slug);
}

export function getRelatedItems(
  item: VaultItem,
  count: number = 3
): VaultItem[] {
  return vaultItems
    .filter((i) => i.id !== item.id && i.category === item.category)
    .slice(0, count);
}

export function getTypeLabel(type: VaultType): string {
  const labels: Record<VaultType, string> = {
    video: "Video",
    briefing: "Briefing",
    template: "Template",
    policy: "Policy",
    framework: "Framework",
    replay: "Replay",
    event: "Event Presentation",
  };
  return labels[type];
}

