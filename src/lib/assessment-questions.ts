// ============================================================
// KLO App — Assessment Questions Data
// ============================================================

export interface AssessmentQuestionOption {
  label: string;
  value: number;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: AssessmentQuestionOption[];
  category: string;
}

export interface AssessmentQuestionSet {
  assessmentId: string;
  questions: AssessmentQuestion[];
}

// ------------------------------------------------------------
// Shared option scales
// ------------------------------------------------------------

export const maturityScale: AssessmentQuestionOption[] = [
  { label: "Not started — we have nothing in place", value: 1 },
  { label: "Exploring — we are aware but haven't acted", value: 2 },
  { label: "Developing — initial efforts are underway", value: 3 },
  { label: "Established — functioning and maintained", value: 4 },
  { label: "Mature — optimized and continuously improved", value: 5 },
];

const agreementScale: AssessmentQuestionOption[] = [
  { label: "Strongly disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Neutral", value: 3 },
  { label: "Agree", value: 4 },
  { label: "Strongly agree", value: 5 },
];

const implementationScale: AssessmentQuestionOption[] = [
  { label: "No — not implemented at all", value: 1 },
  { label: "Minimal — ad-hoc or incomplete", value: 2 },
  { label: "Partial — covers some areas", value: 3 },
  { label: "Mostly — broadly implemented with minor gaps", value: 4 },
  { label: "Fully — comprehensive and actively maintained", value: 5 },
];

// ============================================================
// Church Readiness Assessment
// ============================================================

export const churchReadinessQuestions: AssessmentQuestion[] = [
  {
    id: "cr-1",
    text: "How would you rate the quality and mobile-responsiveness of your church website?",
    options: [
      { label: "We don't have a website", value: 1 },
      { label: "We have a basic site but it's outdated or not mobile-friendly", value: 2 },
      { label: "Our site is functional and mobile-responsive but rarely updated", value: 3 },
      { label: "Our site is professional, mobile-friendly, and regularly updated", value: 4 },
      { label: "Our site is excellent — optimized for SEO, accessibility, and engagement", value: 5 },
    ],
    category: "Infrastructure",
  },
  {
    id: "cr-2",
    text: "Does your church actively maintain social media accounts to engage with the congregation and community?",
    options: [
      { label: "We have no social media presence", value: 1 },
      { label: "We have accounts but they are rarely updated", value: 2 },
      { label: "We post occasionally on one or two platforms", value: 3 },
      { label: "We maintain an active presence on multiple platforms with regular content", value: 4 },
      { label: "We have a comprehensive social media strategy with analytics and engagement tracking", value: 5 },
    ],
    category: "Communication",
  },
  {
    id: "cr-3",
    text: "How mature is your online giving and digital donation capability?",
    options: [
      { label: "We only accept cash and physical checks", value: 1 },
      { label: "We have a basic PayPal or Venmo link", value: 2 },
      { label: "We use a giving platform but it's not integrated with our website", value: 3 },
      { label: "We have integrated online giving with recurring donation options", value: 4 },
      { label: "We offer multiple digital giving channels (app, text, web, kiosk) with reporting", value: 5 },
    ],
    category: "Infrastructure",
  },
  {
    id: "cr-4",
    text: "Does your church live-stream or record services for online viewing?",
    options: [
      { label: "No — all services are in-person only", value: 1 },
      { label: "We occasionally record and upload services after the fact", value: 2 },
      { label: "We live-stream regularly on one platform (e.g., Facebook Live)", value: 3 },
      { label: "We live-stream on multiple platforms with decent production quality", value: 4 },
      { label: "We have a professional streaming setup with multi-platform distribution and an archive", value: 5 },
    ],
    category: "Communication",
  },
  {
    id: "cr-5",
    text: "Do you use a church management system (ChMS) such as Planning Center, Breeze, or similar?",
    options: [
      { label: "No — we use paper records or spreadsheets", value: 1 },
      { label: "We've purchased one but haven't fully implemented it", value: 2 },
      { label: "We use a ChMS for basic member tracking", value: 3 },
      { label: "We actively use a ChMS for membership, groups, and volunteer scheduling", value: 4 },
      { label: "Our ChMS is fully utilized — check-in, giving, groups, communications, and reporting", value: 5 },
    ],
    category: "Data",
  },
  {
    id: "cr-6",
    text: "How well does your church protect its digital assets and member data from cyber threats?",
    options: [
      { label: "We haven't considered cybersecurity at all", value: 1 },
      { label: "We have basic antivirus on some computers", value: 2 },
      { label: "We use passwords and basic security but lack formal policies", value: 3 },
      { label: "We have security policies, regular password updates, and staff training", value: 4 },
      { label: "We follow cybersecurity best practices with audits, MFA, and incident response plans", value: 5 },
    ],
    category: "Infrastructure",
  },
  {
    id: "cr-7",
    text: "How does your church manage and schedule volunteers for ministry activities?",
    options: [
      { label: "Volunteer coordination is entirely informal (phone calls, word of mouth)", value: 1 },
      { label: "We use email or group texts to coordinate", value: 2 },
      { label: "We have a sign-up sheet or simple online form", value: 3 },
      { label: "We use volunteer management software with scheduling and reminders", value: 4 },
      { label: "We have automated scheduling, role tracking, background checks, and reporting", value: 5 },
    ],
    category: "Engagement",
  },
  {
    id: "cr-8",
    text: "Does your church regularly back up its critical data (member records, financial data, content)?",
    options: [
      { label: "No — we have no backup strategy", value: 1 },
      { label: "We occasionally copy files to a USB drive", value: 2 },
      { label: "We back up some data to cloud storage manually", value: 3 },
      { label: "We have automated backups for most critical systems", value: 4 },
      { label: "We have a comprehensive backup and disaster recovery plan with regular testing", value: 5 },
    ],
    category: "Data",
  },
  {
    id: "cr-9",
    text: "Does your church offer a mobile app or mobile-optimized experience for members?",
    options: [
      { label: "No — we have no mobile experience", value: 1 },
      { label: "Our website is somewhat usable on mobile but not optimized", value: 2 },
      { label: "We have a mobile-responsive website with key features accessible", value: 3 },
      { label: "We offer a dedicated church app with events, giving, and sermons", value: 4 },
      { label: "Our app integrates push notifications, groups, messaging, giving, and content streaming", value: 5 },
    ],
    category: "Engagement",
  },
  {
    id: "cr-10",
    text: "How does your church approach digital discipleship and online spiritual formation?",
    options: [
      { label: "We have no digital discipleship efforts", value: 1 },
      { label: "We share devotionals or scripture occasionally via email or social media", value: 2 },
      { label: "We offer some online Bible studies or small group resources", value: 3 },
      { label: "We have structured digital discipleship pathways and online groups", value: 4 },
      { label: "We run comprehensive digital discipleship programs with tracking, mentoring, and multimedia content", value: 5 },
    ],
    category: "Engagement",
  },
];

// ============================================================
// AI Readiness Assessment
// ============================================================

export const aiReadinessQuestions: AssessmentQuestion[] = [
  {
    id: "ai-1",
    text: "How would you describe the overall quality and accessibility of your organization's data?",
    options: [
      { label: "Our data is siloed, inconsistent, and largely inaccessible", value: 1 },
      { label: "We have some data but it's scattered across systems with no standards", value: 2 },
      { label: "We've begun consolidating data and establishing basic quality standards", value: 3 },
      { label: "Our data is well-organized, documented, and accessible to stakeholders", value: 4 },
      { label: "We have a mature data infrastructure with governance, quality monitoring, and a data catalog", value: 5 },
    ],
    category: "Data Foundation",
  },
  {
    id: "ai-2",
    text: "Does your senior leadership actively champion and support AI adoption?",
    options: agreementScale,
    category: "Culture",
  },
  {
    id: "ai-3",
    text: "What is the general level of AI literacy among your staff and team members?",
    options: [
      { label: "Very low — most people don't understand what AI is", value: 1 },
      { label: "Low — some awareness but no practical knowledge", value: 2 },
      { label: "Moderate — staff understand AI concepts but lack hands-on experience", value: 3 },
      { label: "Good — many team members have used AI tools and understand capabilities", value: 4 },
      { label: "High — widespread AI fluency with ongoing training programs", value: 5 },
    ],
    category: "Culture",
  },
  {
    id: "ai-4",
    text: "Has your organization established ethical guidelines or principles for AI use?",
    options: implementationScale,
    category: "Governance",
  },
  {
    id: "ai-5",
    text: "How would you describe your organization's data infrastructure readiness for AI workloads?",
    options: [
      { label: "We have no centralized data storage or processing capability", value: 1 },
      { label: "We use basic databases and file storage", value: 2 },
      { label: "We have cloud infrastructure but it's not optimized for AI/ML", value: 3 },
      { label: "We have scalable cloud infrastructure with data pipelines in place", value: 4 },
      { label: "We have production-grade ML infrastructure with monitoring, versioning, and deployment pipelines", value: 5 },
    ],
    category: "Data Foundation",
  },
  {
    id: "ai-6",
    text: "How prepared is your organization to manage the change that comes with AI adoption?",
    options: [
      { label: "We have no change management processes", value: 1 },
      { label: "We handle change reactively on a case-by-case basis", value: 2 },
      { label: "We have basic change management but it hasn't been applied to AI", value: 3 },
      { label: "We have a defined change management approach that includes technology adoption", value: 4 },
      { label: "We have a mature change management framework with AI-specific playbooks", value: 5 },
    ],
    category: "Culture",
  },
  {
    id: "ai-7",
    text: "Has your organization identified specific, high-value use cases where AI could drive measurable outcomes?",
    options: [
      { label: "No — we haven't thought about specific AI use cases", value: 1 },
      { label: "We have vague ideas but nothing concrete", value: 2 },
      { label: "We've brainstormed some potential use cases but haven't prioritized them", value: 3 },
      { label: "We've identified and prioritized several concrete use cases with expected ROI", value: 4 },
      { label: "We have a pipeline of validated use cases with pilots underway or completed", value: 5 },
    ],
    category: "Use Cases",
  },
  {
    id: "ai-8",
    text: "Has your organization allocated a dedicated budget for AI initiatives (tools, talent, training)?",
    options: [
      { label: "No budget has been allocated for AI", value: 1 },
      { label: "We might fund small experiments from existing budgets", value: 2 },
      { label: "We have a small exploratory budget for AI pilots", value: 3 },
      { label: "We have a defined AI budget covering tools, training, and some headcount", value: 4 },
      { label: "We have a significant, multi-year AI investment strategy", value: 5 },
    ],
    category: "Use Cases",
  },
  {
    id: "ai-9",
    text: "How does your organization approach evaluating and selecting AI vendors or platforms?",
    options: [
      { label: "We have no vendor evaluation process for AI", value: 1 },
      { label: "We rely on individual research with no formal evaluation criteria", value: 2 },
      { label: "We have a basic evaluation checklist but it's not AI-specific", value: 3 },
      { label: "We have a defined process for evaluating AI vendors including security and ethics review", value: 4 },
      { label: "We have a comprehensive AI vendor governance framework with ongoing performance monitoring", value: 5 },
    ],
    category: "Governance",
  },
  {
    id: "ai-10",
    text: "Has your organization defined success metrics or KPIs for measuring AI initiative outcomes?",
    options: [
      { label: "No — we haven't considered how to measure AI success", value: 1 },
      { label: "We have general goals but no specific metrics", value: 2 },
      { label: "We've defined some metrics but don't consistently track them", value: 3 },
      { label: "We have defined KPIs tied to business outcomes for AI projects", value: 4 },
      { label: "We have a robust measurement framework with dashboards, baselines, and continuous tracking", value: 5 },
    ],
    category: "Use Cases",
  },
];

// ============================================================
// Technology Governance Assessment
// ============================================================

export const governanceQuestions: AssessmentQuestion[] = [
  {
    id: "gov-1",
    text: "Does your organization have comprehensive, documented IT policies that are reviewed and updated regularly?",
    options: implementationScale,
    category: "Policy",
  },
  {
    id: "gov-2",
    text: "How well does your organization comply with relevant regulatory requirements (e.g., GDPR, HIPAA, SOX)?",
    options: [
      { label: "We are unaware of which regulations apply to us", value: 1 },
      { label: "We know the regulations but have done little to comply", value: 2 },
      { label: "We have started implementing compliance measures for key regulations", value: 3 },
      { label: "We are largely compliant with documented evidence and controls", value: 4 },
      { label: "We maintain full compliance with regular audits, reporting, and continuous improvement", value: 5 },
    ],
    category: "Compliance",
  },
  {
    id: "gov-3",
    text: "Does your organization follow a formal change management process for IT systems and applications?",
    options: [
      { label: "No — changes are made without any formal process", value: 1 },
      { label: "Changes are loosely tracked but there's no approval workflow", value: 2 },
      { label: "We have a basic change request process for major changes", value: 3 },
      { label: "We follow a structured change management process with approvals and rollback plans", value: 4 },
      { label: "We have a mature ITIL-aligned change management process with CAB review and metrics", value: 5 },
    ],
    category: "Risk",
  },
  {
    id: "gov-4",
    text: "Does your organization have a documented disaster recovery and business continuity plan?",
    options: implementationScale,
    category: "Risk",
  },
  {
    id: "gov-5",
    text: "How does your organization manage third-party technology vendors and service providers?",
    options: [
      { label: "We have no formal vendor management process", value: 1 },
      { label: "We track vendors in a spreadsheet with minimal oversight", value: 2 },
      { label: "We have contracts and SLAs but don't actively monitor performance", value: 3 },
      { label: "We have a vendor management program with regular reviews and risk assessments", value: 4 },
      { label: "We have a comprehensive vendor governance framework with scorecards, audits, and risk tiers", value: 5 },
    ],
    category: "Strategy",
  },
  {
    id: "gov-6",
    text: "Does your organization conduct regular security audits or assessments of its IT environment?",
    options: [
      { label: "No — we have never conducted a security audit", value: 1 },
      { label: "We've done a one-time assessment but nothing ongoing", value: 2 },
      { label: "We conduct audits annually but scope is limited", value: 3 },
      { label: "We perform comprehensive annual audits with remediation tracking", value: 4 },
      { label: "We conduct continuous security monitoring with periodic third-party audits and penetration testing", value: 5 },
    ],
    category: "Compliance",
  },
  {
    id: "gov-7",
    text: "Does your board or executive leadership have clear visibility into technology risks and investments?",
    options: [
      { label: "Technology is rarely discussed at the leadership level", value: 1 },
      { label: "Leaders receive occasional informal updates on technology", value: 2 },
      { label: "There are periodic technology reports but no formal governance structure", value: 3 },
      { label: "Technology is a standing agenda item with regular dashboards and reporting", value: 4 },
      { label: "A formal technology governance committee oversees strategy, risk, and investment decisions", value: 5 },
    ],
    category: "Strategy",
  },
  {
    id: "gov-8",
    text: "How well is your IT strategy aligned with your organization's overall mission and business goals?",
    options: [
      { label: "IT operates independently with no connection to organizational strategy", value: 1 },
      { label: "There is some awareness but no formal alignment", value: 2 },
      { label: "IT objectives are loosely mapped to business goals", value: 3 },
      { label: "IT strategy is formally aligned with business strategy and reviewed annually", value: 4 },
      { label: "IT is deeply embedded in strategic planning with co-created goals and shared KPIs", value: 5 },
    ],
    category: "Strategy",
  },
  {
    id: "gov-9",
    text: "Does your organization have a documented incident response plan for IT security events?",
    options: implementationScale,
    category: "Risk",
  },
  {
    id: "gov-10",
    text: "How does your organization govern and approve technology spending and investment decisions?",
    options: [
      { label: "Technology purchases are made ad-hoc with no formal approval", value: 1 },
      { label: "There is basic approval but no structured budgeting process", value: 2 },
      { label: "We have an annual IT budget but limited tracking against outcomes", value: 3 },
      { label: "We have a structured budgeting process with ROI analysis for major investments", value: 4 },
      { label: "We have a formal IT investment governance process with portfolio management and value realization tracking", value: 5 },
    ],
    category: "Policy",
  },
];

// ============================================================
// Cyber Risk Assessment
// ============================================================

export const cyberRiskQuestions: AssessmentQuestion[] = [
  {
    id: "cyber-1",
    text: "Does your organization provide regular cybersecurity awareness training to all employees?",
    options: [
      { label: "No training has ever been provided", value: 1 },
      { label: "We did a one-time training session", value: 2 },
      { label: "We provide annual security awareness training", value: 3 },
      { label: "We conduct regular training with simulated phishing exercises", value: 4 },
      { label: "We have a comprehensive, ongoing security culture program with metrics and role-based training", value: 5 },
    ],
    category: "People",
  },
  {
    id: "cyber-2",
    text: "How does your organization enforce password policies and authentication standards?",
    options: [
      { label: "No password policy exists", value: 1 },
      { label: "We have informal guidelines but no enforcement", value: 2 },
      { label: "We enforce basic password complexity requirements", value: 3 },
      { label: "We enforce strong passwords with multi-factor authentication (MFA) on key systems", value: 4 },
      { label: "We have enterprise-wide MFA, SSO, and passwordless authentication with regular audits", value: 5 },
    ],
    category: "People",
  },
  {
    id: "cyber-3",
    text: "Is your network properly segmented to limit the blast radius of a potential breach?",
    options: [
      { label: "No — we have a flat network with no segmentation", value: 1 },
      { label: "We have basic VLANs but no security-driven segmentation", value: 2 },
      { label: "We segment guest Wi-Fi from internal networks", value: 3 },
      { label: "We have segmented networks with firewall rules between zones", value: 4 },
      { label: "We use micro-segmentation with zero-trust network architecture", value: 5 },
    ],
    category: "Technology",
  },
  {
    id: "cyber-4",
    text: "What level of endpoint protection does your organization deploy across devices?",
    options: [
      { label: "No endpoint protection is deployed", value: 1 },
      { label: "Basic antivirus on some devices", value: 2 },
      { label: "Antivirus deployed across most devices with some management", value: 3 },
      { label: "EDR (Endpoint Detection and Response) deployed with centralized management", value: 4 },
      { label: "Advanced EDR/XDR with automated response, threat hunting, and full device management", value: 5 },
    ],
    category: "Technology",
  },
  {
    id: "cyber-5",
    text: "Does your organization have a documented and tested incident response plan?",
    options: [
      { label: "No incident response plan exists", value: 1 },
      { label: "We have an informal understanding of what to do in an incident", value: 2 },
      { label: "We have a documented plan but it has never been tested", value: 3 },
      { label: "We have a documented plan that is tested annually through tabletop exercises", value: 4 },
      { label: "We have a mature IR program with regular drills, retainers, forensic capabilities, and lessons learned", value: 5 },
    ],
    category: "Process",
  },
  {
    id: "cyber-6",
    text: "How does your organization handle encryption of sensitive data at rest and in transit?",
    options: [
      { label: "No encryption is used", value: 1 },
      { label: "We use HTTPS for our website but that's about it", value: 2 },
      { label: "We encrypt some sensitive data but coverage is incomplete", value: 3 },
      { label: "We encrypt data at rest and in transit for most critical systems", value: 4 },
      { label: "We have comprehensive encryption across all systems with key management and regular rotation", value: 5 },
    ],
    category: "Technology",
  },
  {
    id: "cyber-7",
    text: "How does your organization manage user access controls and the principle of least privilege?",
    options: [
      { label: "Everyone has admin or broad access to most systems", value: 1 },
      { label: "We have some role-based access but it's not consistently enforced", value: 2 },
      { label: "We've implemented role-based access for critical systems", value: 3 },
      { label: "We follow least privilege with regular access reviews and deprovisioning", value: 4 },
      { label: "We have automated identity governance with just-in-time access, PAM, and continuous monitoring", value: 5 },
    ],
    category: "People",
  },
  {
    id: "cyber-8",
    text: "How current is your organization's patch management for operating systems and applications?",
    options: [
      { label: "We don't have a patch management process", value: 1 },
      { label: "Patches are applied sporadically when someone remembers", value: 2 },
      { label: "We patch critical vulnerabilities within 30 days", value: 3 },
      { label: "We have an automated patch management process with defined SLAs", value: 4 },
      { label: "We have comprehensive patch management with vulnerability scanning, prioritization, and compliance tracking", value: 5 },
    ],
    category: "Process",
  },
  {
    id: "cyber-9",
    text: "How does your organization assess and manage cybersecurity risks from third-party vendors?",
    options: [
      { label: "We don't evaluate vendor security at all", value: 1 },
      { label: "We ask vendors basic security questions during procurement", value: 2 },
      { label: "We require security questionnaires or certifications from critical vendors", value: 3 },
      { label: "We conduct formal third-party risk assessments with ongoing monitoring for key vendors", value: 4 },
      { label: "We have a mature TPRM program with risk tiers, continuous monitoring, and contractual security requirements", value: 5 },
    ],
    category: "Process",
  },
  {
    id: "cyber-10",
    text: "Does your organization have continuous security monitoring and alerting capabilities?",
    options: [
      { label: "No — we have no security monitoring in place", value: 1 },
      { label: "We check logs occasionally when there's a problem", value: 2 },
      { label: "We have basic log aggregation with some alerts configured", value: 3 },
      { label: "We have a SIEM with 24/7 alerting and defined response procedures", value: 4 },
      { label: "We have a SOC (in-house or managed) with SIEM/SOAR, threat intelligence, and automated response", value: 5 },
    ],
    category: "Technology",
  },
];

// ============================================================
// Question Set Map
// ============================================================

export const assessmentQuestionSets: Record<string, AssessmentQuestion[]> = {
  "church-readiness": churchReadinessQuestions,
  "ai-readiness": aiReadinessQuestions,
  governance: governanceQuestions,
  "cyber-risk": cyberRiskQuestions,
};
