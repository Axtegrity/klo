export type MarketplaceCategory =
  | "AI & Ethics"
  | "Church & Tech"
  | "Governance"
  | "Leadership";

export type MarketplaceProductType =
  | "toolkit"
  | "template"
  | "framework"
  | "course"
  | "bundle";

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  category: MarketplaceCategory;
  type: MarketplaceProductType;
  imageTag: string;
  features: string[];
  popular: boolean;
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  "AI & Ethics",
  "Church & Tech",
  "Governance",
  "Leadership",
];

export const marketplaceProducts: MarketplaceProduct[] = [
  {
    id: "mp-001",
    title: "AI Policy Template Bundle",
    description:
      "A comprehensive collection of ready-to-customize AI governance policy templates for organizations of any size. Includes acceptable use policies, risk assessment checklists, and vendor evaluation scorecards.",
    price: 49.99,
    category: "AI & Ethics",
    type: "bundle",
    imageTag: "\uD83D\uDCDC",
    features: [
      "12 editable policy templates",
      "Risk assessment checklist",
      "Vendor evaluation scorecard",
      "Implementation roadmap",
      "Quarterly update guide",
    ],
    popular: true,
  },
  {
    id: "mp-002",
    title: "Church Digital Readiness Toolkit",
    description:
      "Everything your ministry needs to evaluate and improve its digital maturity. From tech audits to congregation engagement strategies, this toolkit walks you through every step.",
    price: 39.99,
    category: "Church & Tech",
    type: "toolkit",
    imageTag: "\u26EA",
    features: [
      "Digital maturity scorecard",
      "Tech audit worksheet",
      "Congregation survey templates",
      "Vendor comparison matrix",
      "90-day action plan",
    ],
    popular: true,
  },
  {
    id: "mp-003",
    title: "Executive AI Strategy Framework",
    description:
      "A senior-leader framework for building and executing an enterprise AI strategy. Covers opportunity identification, resource allocation, risk mitigation, and board-level reporting.",
    price: 149.99,
    category: "Leadership",
    type: "framework",
    imageTag: "\uD83C\uDFAF",
    features: [
      "Strategic opportunity matrix",
      "ROI projection worksheets",
      "Board presentation deck",
      "Risk mitigation playbook",
      "Quarterly review templates",
      "Executive briefing guide",
    ],
    popular: true,
  },
  {
    id: "mp-004",
    title: "Cybersecurity Assessment Kit",
    description:
      "Identify vulnerabilities and strengthen your organization's cyber posture with this hands-on assessment kit. Designed for non-technical leaders who need clear, actionable results.",
    price: 59.99,
    category: "Governance",
    type: "toolkit",
    imageTag: "\uD83D\uDD12",
    features: [
      "Threat landscape overview",
      "Self-assessment questionnaire",
      "Gap analysis worksheet",
      "Incident response template",
      "Employee training checklist",
    ],
    popular: false,
  },
  {
    id: "mp-005",
    title: "Digital Ministry Starter Pack",
    description:
      "Launch or level-up your church's digital ministry with this all-in-one starter pack. Covers livestreaming, social media, online giving, and digital discipleship pathways.",
    price: 29.99,
    category: "Church & Tech",
    type: "bundle",
    imageTag: "\uD83D\uDE80",
    features: [
      "Livestream setup guide",
      "Social media calendar templates",
      "Online giving integration guide",
      "Digital discipleship pathway",
    ],
    popular: false,
  },
  {
    id: "mp-006",
    title: "AI Ethics Decision-Making Course",
    description:
      "A self-paced video course that equips leaders to navigate the ethical complexities of AI adoption. Includes case studies, discussion guides, and a personal ethics framework builder.",
    price: 89.99,
    category: "AI & Ethics",
    type: "course",
    imageTag: "\uD83C\uDF93",
    features: [
      "6 video modules (3+ hours)",
      "Real-world case studies",
      "Ethics framework builder",
      "Discussion guide for teams",
      "Certificate of completion",
    ],
    popular: false,
  },
  {
    id: "mp-007",
    title: "Board Governance Playbook",
    description:
      "Empower your board with structured governance frameworks for technology oversight. Includes meeting agendas, reporting templates, and fiduciary responsibility guides for the digital age.",
    price: 69.99,
    category: "Governance",
    type: "framework",
    imageTag: "\uD83D\uDCCB",
    features: [
      "Board meeting agenda templates",
      "Technology oversight checklist",
      "Fiduciary responsibility guide",
      "Annual review framework",
      "Risk dashboard template",
    ],
    popular: false,
  },
  {
    id: "mp-008",
    title: "Change Leadership Masterclass",
    description:
      "Lead your organization through digital transformation with confidence. This masterclass provides proven change management strategies tailored for faith-based and mission-driven organizations.",
    price: 119.99,
    category: "Leadership",
    type: "course",
    imageTag: "\uD83D\uDCA1",
    features: [
      "8 video modules (4+ hours)",
      "Change readiness assessment",
      "Stakeholder mapping tools",
      "Communication plan templates",
      "Resistance management guide",
      "Post-change evaluation kit",
    ],
    popular: true,
  },
  {
    id: "mp-009",
    title: "Data Privacy Compliance Templates",
    description:
      "Stay compliant with evolving data privacy regulations. This template set covers GDPR, CCPA, and church-specific data handling requirements with fill-in-the-blank simplicity.",
    price: 34.99,
    category: "Governance",
    type: "template",
    imageTag: "\uD83D\uDEE1\uFE0F",
    features: [
      "Privacy policy generator",
      "Data inventory worksheet",
      "Consent form templates",
      "Breach notification procedures",
      "Annual audit checklist",
    ],
    popular: false,
  },
  {
    id: "mp-010",
    title: "Responsible AI Adoption Toolkit",
    description:
      "A step-by-step toolkit for introducing AI tools into your organization responsibly. Covers pilot programs, staff training, ethical guardrails, and measurable success criteria.",
    price: 9.99,
    category: "AI & Ethics",
    type: "toolkit",
    imageTag: "\uD83E\uDD16",
    features: [
      "AI readiness checklist",
      "Pilot program blueprint",
      "Staff training outline",
      "Ethical guardrail framework",
    ],
    popular: false,
  },
];
