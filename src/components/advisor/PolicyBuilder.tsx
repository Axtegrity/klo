"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Building2,
  Settings2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  CalendarCheck,
} from "lucide-react";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PolicyType =
  | "AI Usage Policy"
  | "Data Privacy Policy"
  | "Technology Governance Policy"
  | "Cybersecurity Policy"
  | "Digital Ministry Policy";

type OrgType = "Church" | "Enterprise" | "Nonprofit" | "Government" | "Education";

type Tone = "Formal" | "Professional" | "Accessible";

const POLICY_TYPES: PolicyType[] = [
  "AI Usage Policy",
  "Data Privacy Policy",
  "Technology Governance Policy",
  "Cybersecurity Policy",
  "Digital Ministry Policy",
];

const ORG_TYPES: OrgType[] = [
  "Church",
  "Enterprise",
  "Nonprofit",
  "Government",
  "Education",
];

const TONES: Tone[] = ["Formal", "Professional", "Accessible"];

const KEY_CONCERNS = [
  "Data Privacy",
  "AI Ethics",
  "Employee Training",
  "Compliance",
  "Risk Management",
  "Youth Safety",
  "Budget Constraints",
] as const;

type KeyConcern = (typeof KEY_CONCERNS)[number];

interface OrgDetails {
  orgName: string;
  orgType: OrgType | "";
  teamSize: string;
  industry: string;
}

interface PolicyPreferences {
  tone: Tone;
  concerns: KeyConcern[];
}

/* ------------------------------------------------------------------ */
/*  Mock policy generator                                              */
/* ------------------------------------------------------------------ */

function generateMockPolicy(
  policyType: PolicyType,
  org: OrgDetails,
  prefs: PolicyPreferences
): string {
  const orgLabel = org.orgName || "Your Organization";
  const concernsList = prefs.concerns.map((c) => `- ${c}`).join("\n");

  const templates: Record<PolicyType, string> = {
    "AI Usage Policy": `# ${orgLabel} — AI Usage Policy

## 1. Purpose & Scope

This policy establishes guidelines for the responsible adoption, deployment, and oversight of artificial intelligence (AI) technologies within **${orgLabel}**. It applies to all staff, volunteers, contractors, and third-party vendors who develop, procure, or interact with AI-powered tools on behalf of the organization.

## 2. Guiding Principles

- **Transparency** — AI systems must be explainable; stakeholders should understand how decisions are influenced by AI.
- **Accountability** — A designated AI governance lead will oversee compliance with this policy.
- **Fairness & Non-Discrimination** — AI tools must be regularly audited to prevent biased outcomes.
- **Privacy by Design** — Personal data used by AI systems must comply with all applicable privacy regulations.

## 3. Approved Use Cases

| Category | Examples |
|----------|----------|
| Communication | Drafting emails, translating content, summarizing meeting notes |
| Research | Market analysis, literature review, data visualization |
| Operations | Scheduling, workflow automation, inventory management |

## 4. Prohibited Uses

- Autonomous decision-making on hiring, termination, or disciplinary actions without human review.
- Surveillance of employees or community members without explicit consent.
- Generation of content that impersonates real individuals.

## 5. Data Handling & Privacy

All data processed by AI tools must adhere to ${orgLabel}'s existing data privacy framework. Sensitive categories—including personally identifiable information (PII), health records, and financial data—require additional safeguards:

- Data minimization: only supply the minimum necessary data.
- Encryption in transit and at rest.
- Vendor data-processing agreements must be reviewed by legal counsel.

## 6. Key Concerns Addressed

${concernsList}

## 7. Training & Awareness

All team members (team size: ${org.teamSize || "N/A"}) will complete an introductory AI literacy module within 90 days of this policy's effective date. Annual refresher training is required.

## 8. Review & Amendment

This policy will be reviewed semi-annually and updated as the AI landscape evolves. Amendments require approval from the AI governance lead and senior leadership.

---

*Generated for ${orgLabel} (${org.orgType || "Organization"}) in the ${org.industry || "General"} sector. Tone: ${prefs.tone}.*
`,

    "Data Privacy Policy": `# ${orgLabel} — Data Privacy Policy

## 1. Introduction

**${orgLabel}** is committed to protecting the personal data of its employees, customers, partners, and community members. This Data Privacy Policy outlines how we collect, use, store, and share personal information in compliance with applicable regulations.

## 2. Scope

This policy applies to all personal data processed by ${orgLabel}, whether collected online, offline, or through third-party services.

## 3. Data Collection

We collect personal data only when there is a clear, lawful basis:

- **Consent** — Individuals have given explicit permission.
- **Contractual necessity** — Data is required to fulfill a service agreement.
- **Legitimate interest** — Processing is necessary for organizational operations, balanced against individual rights.

### Categories of Data Collected

- Names, contact information, and demographic details
- Financial and payment information (processed via PCI-compliant systems)
- Usage analytics and interaction logs
- Employee records (HR-related)

## 4. Data Use & Retention

- Data is used solely for the purposes stated at the time of collection.
- Retention periods are defined per data category and reviewed annually.
- Data no longer required is securely deleted or anonymized.

## 5. Data Sharing & Third Parties

Personal data is shared with third parties only when:

- Required by law or regulation
- Necessary for service delivery (with a signed Data Processing Agreement)
- The individual has provided informed consent

## 6. Security Measures

- Encryption of data in transit (TLS 1.2+) and at rest (AES-256)
- Role-based access controls
- Regular vulnerability assessments and penetration testing
- Incident response plan with 72-hour breach notification

## 7. Individual Rights

Individuals may exercise the following rights by contacting our Data Protection Officer:

- Right to access their personal data
- Right to rectification of inaccurate data
- Right to erasure ("right to be forgotten")
- Right to restrict or object to processing
- Right to data portability

## 8. Key Concerns Addressed

${concernsList}

## 9. Policy Review

This policy is reviewed annually and updated to reflect changes in regulation, technology, and organizational practices.

---

*Generated for ${orgLabel} (${org.orgType || "Organization"}) · Team size: ${org.teamSize || "N/A"} · Industry: ${org.industry || "General"} · Tone: ${prefs.tone}.*
`,

    "Technology Governance Policy": `# ${orgLabel} — Technology Governance Policy

## 1. Purpose

This policy provides a framework for the evaluation, procurement, deployment, and lifecycle management of technology systems within **${orgLabel}**. It ensures technology investments align with strategic goals, mitigate risk, and deliver measurable value.

## 2. Governance Structure

- **Technology Steering Committee** — Senior leaders who approve major initiatives.
- **IT Operations Lead** — Responsible for day-to-day infrastructure management.
- **Security & Compliance Officer** — Ensures all systems meet regulatory and security requirements.

## 3. Technology Procurement

All technology purchases above $500 require:

1. A documented business case with expected ROI
2. Security and compliance review
3. Vendor due diligence (including data handling practices)
4. Steering Committee approval for purchases above $5,000

## 4. System Lifecycle Management

| Phase | Activities |
|-------|-----------|
| Planning | Requirements gathering, budget allocation |
| Acquisition | Vendor selection, contract negotiation |
| Implementation | Deployment, configuration, user training |
| Operations | Monitoring, maintenance, support |
| Retirement | Data migration, secure decommissioning |

## 5. Access Control & Identity Management

- Principle of least privilege for all system access
- Multi-factor authentication required for administrative accounts
- Quarterly access reviews conducted by department heads

## 6. Change Management

All system changes follow a structured change management process:

- Change request documentation
- Impact assessment and testing
- Approval by the appropriate authority
- Scheduled deployment with rollback plan

## 7. Key Concerns Addressed

${concernsList}

## 8. Review Cycle

This policy is reviewed annually or following a significant technology incident.

---

*Generated for ${orgLabel} (${org.orgType || "Organization"}) · Team size: ${org.teamSize || "N/A"} · Industry: ${org.industry || "General"} · Tone: ${prefs.tone}.*
`,

    "Cybersecurity Policy": `# ${orgLabel} — Cybersecurity Policy

## 1. Purpose

This Cybersecurity Policy establishes the standards, procedures, and responsibilities necessary to protect **${orgLabel}**'s digital assets, networks, and data from cyber threats.

## 2. Scope

This policy applies to all employees, contractors, volunteers, and third-party vendors who access ${orgLabel}'s information systems.

## 3. Risk Management

- Annual cybersecurity risk assessments
- Threat modeling for critical systems
- Risk register maintained and reviewed quarterly

## 4. Access Controls

- Unique credentials for every user; no shared accounts
- Multi-factor authentication (MFA) on all externally facing systems
- Privileged access management for administrative accounts
- Automatic account lockout after 5 failed login attempts

## 5. Network Security

- Firewalls and intrusion detection/prevention systems at network perimeters
- Network segmentation isolating sensitive systems
- VPN required for remote access
- Regular vulnerability scanning and patching (critical patches within 72 hours)

## 6. Endpoint Protection

- Managed antivirus/EDR on all organization-owned devices
- Full-disk encryption required
- Automated OS and application updates
- Mobile device management (MDM) for organization-issued devices

## 7. Incident Response

### Response Phases:

1. **Detection & Identification** — Monitor alerts; classify severity.
2. **Containment** — Isolate affected systems to prevent spread.
3. **Eradication** — Remove the threat and patch vulnerabilities.
4. **Recovery** — Restore systems from verified backups.
5. **Post-Incident Review** — Document lessons learned; update policies.

### Notification Requirements:

- Internal stakeholders within 4 hours
- Regulatory authorities within 72 hours (where required)
- Affected individuals without undue delay

## 8. Employee Responsibilities

- Complete annual cybersecurity awareness training
- Report suspicious emails and activities immediately
- Never share credentials or bypass security controls

## 9. Key Concerns Addressed

${concernsList}

## 10. Policy Review

Reviewed semi-annually and after any significant security incident.

---

*Generated for ${orgLabel} (${org.orgType || "Organization"}) · Team size: ${org.teamSize || "N/A"} · Industry: ${org.industry || "General"} · Tone: ${prefs.tone}.*
`,

    "Digital Ministry Policy": `# ${orgLabel} — Digital Ministry Policy

## 1. Mission Alignment

This policy guides **${orgLabel}**'s use of digital platforms and technology to extend its ministry, engage its community, and steward resources responsibly in the digital age.

## 2. Scope

This policy applies to all staff, ministry leaders, volunteers, and content creators who represent ${orgLabel} in digital spaces.

## 3. Digital Communication Standards

- All public-facing digital content must reflect the organization's values and mission.
- Social media accounts require designated administrators with documented guidelines.
- Response protocols: acknowledge messages within 24 hours during business days.

## 4. Online Community Safety

### Youth Protection

- All digital interactions involving minors must comply with the organization's child protection policy.
- Two-adult rule applies to digital communications with youth.
- Parental consent required for minors participating in online programming.
- Content moderation enabled on all public-facing platforms.

### General Safety

- Clear community guidelines posted on all platforms.
- Zero-tolerance policy for harassment, hate speech, and exploitation.
- Designated moderators for live events and open forums.

## 5. Technology Stewardship

- Annual technology audit to evaluate platform effectiveness and cost efficiency.
- Preference for tools that respect user privacy and align with organizational values.
- Budget allocation: technology spending reviewed quarterly against ministry impact metrics.

## 6. Content & Intellectual Property

- Original content created by staff is property of ${orgLabel}.
- Third-party content requires proper licensing and attribution.
- Sermon recordings, teaching materials, and creative works should be archived systematically.

## 7. Data & Privacy

- Donor and member data treated with the highest confidentiality standards.
- Email lists are opt-in only; unsubscribe options clearly visible.
- No selling or sharing of personal data with external parties.

## 8. Key Concerns Addressed

${concernsList}

## 9. Training & Equipping

All ministry leaders complete a digital ministry orientation covering:

- Platform best practices
- Online safety protocols
- Content creation guidelines
- Data handling responsibilities

## 10. Policy Review

This policy is reviewed annually by the leadership team with input from ministry leaders.

---

*Generated for ${orgLabel} (${org.orgType || "Organization"}) · Team size: ${org.teamSize || "N/A"} · Industry: ${org.industry || "General"} · Tone: ${prefs.tone}.*
`,
  };

  return templates[policyType];
}

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

const STEPS = [
  { label: "Policy Type", icon: FileText },
  { label: "Organization", icon: Building2 },
  { label: "Preferences", icon: Settings2 },
  { label: "Your Policy", icon: Sparkles },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === current;
        const isComplete = i < current;
        return (
          <div key={step.label} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isActive
                    ? "bg-[#68E9FA] text-[#022886] border-[#68E9FA] shadow-md shadow-[#68E9FA]/20"
                    : isComplete
                    ? "bg-[#68E9FA]/20 text-[#68E9FA] border-[#68E9FA]/40"
                    : "bg-klo-dark text-klo-muted border-klo-slate"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-[#68E9FA]" : isComplete ? "text-klo-text" : "text-klo-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 h-px mt-[-1.25rem] ${
                  isComplete ? "bg-[#68E9FA]/40" : "bg-klo-slate"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function PolicyBuilder() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [policyType, setPolicyType] = useState<PolicyType | "">("");

  // Step 2
  const [orgDetails, setOrgDetails] = useState<OrgDetails>({
    orgName: "",
    orgType: "",
    teamSize: "",
    industry: "",
  });

  // Step 3
  const [preferences, setPreferences] = useState<PolicyPreferences>({
    tone: "Professional",
    concerns: [],
  });

  // Step 4
  const [generatedPolicy, setGeneratedPolicy] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  /* Navigation helpers */
  function next() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  }

  function prev() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  /* Generate mock policy */
  async function handleGenerate() {
    if (!policyType) return;
    setIsGenerating(true);

    // Simulate API latency
    await new Promise((r) => setTimeout(r, 1500));

    const policy = generateMockPolicy(policyType, orgDetails, preferences);
    setGeneratedPolicy(policy);
    setIsGenerating(false);
    next();
  }

  /* Copy to clipboard */
  async function copyToClipboard() {
    await navigator.clipboard.writeText(generatedPolicy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* Concern toggle */
  function toggleConcern(concern: KeyConcern) {
    setPreferences((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter((c) => c !== concern)
        : [...prev.concerns, concern],
    }));
  }

  /* ---------------------------------------------------------------- */
  /*  Step renderers                                                   */
  /* ---------------------------------------------------------------- */

  function renderStep1() {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-display text-klo-text mb-2">
          Select Policy Type
        </h2>
        <p className="text-klo-muted text-sm mb-6">
          Choose the type of policy you need and we&apos;ll generate a
          comprehensive draft tailored to your organization.
        </p>

        <div className="grid gap-3">
          {POLICY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setPolicyType(type)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                policyType === type
                  ? "border-[#68E9FA] bg-[#68E9FA]/10 text-klo-text"
                  : "border-klo-slate bg-klo-dark text-klo-muted hover:border-[#68E9FA]/30 hover:text-klo-text"
              }`}
            >
              <span className="font-medium">{type}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={next} disabled={!policyType}>
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-display text-klo-text mb-2">
          Organization Details
        </h2>
        <p className="text-klo-muted text-sm mb-6">
          Tell us about your organization so the policy fits your context.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-klo-text mb-1.5">
              Organization Name
            </label>
            <input
              type="text"
              value={orgDetails.orgName}
              onChange={(e) =>
                setOrgDetails((d) => ({ ...d, orgName: e.target.value }))
              }
              placeholder="e.g. Grace Community Church"
              className="w-full px-4 py-3 rounded-xl bg-klo-dark border border-klo-slate text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#68E9FA]/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-klo-text mb-1.5">
              Organization Type
            </label>
            <select
              value={orgDetails.orgType}
              onChange={(e) =>
                setOrgDetails((d) => ({
                  ...d,
                  orgType: e.target.value as OrgType,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-klo-dark border border-klo-slate text-klo-text focus:outline-none focus:border-[#68E9FA]/60 transition-colors appearance-none"
            >
              <option value="">Select type…</option>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-klo-text mb-1.5">
              Team Size
            </label>
            <input
              type="text"
              value={orgDetails.teamSize}
              onChange={(e) =>
                setOrgDetails((d) => ({ ...d, teamSize: e.target.value }))
              }
              placeholder="e.g. 50"
              className="w-full px-4 py-3 rounded-xl bg-klo-dark border border-klo-slate text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#68E9FA]/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-klo-text mb-1.5">
              Industry
            </label>
            <input
              type="text"
              value={orgDetails.industry}
              onChange={(e) =>
                setOrgDetails((d) => ({ ...d, industry: e.target.value }))
              }
              placeholder="e.g. Faith-Based, Healthcare, Finance"
              className="w-full px-4 py-3 rounded-xl bg-klo-dark border border-klo-slate text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#68E9FA]/60 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={prev}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={next}>
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-display text-klo-text mb-2">
          Policy Preferences
        </h2>
        <p className="text-klo-muted text-sm mb-6">
          Customize the tone and focus areas for your generated policy.
        </p>

        {/* Tone */}
        <div>
          <label className="block text-sm text-klo-text mb-2">Tone</label>
          <div className="flex gap-3">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setPreferences((p) => ({ ...p, tone: t }))}
                className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                  preferences.tone === t
                    ? "border-[#68E9FA] bg-[#68E9FA]/10 text-[#68E9FA]"
                    : "border-klo-slate bg-klo-dark text-klo-muted hover:border-[#68E9FA]/30"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Key concerns */}
        <div>
          <label className="block text-sm text-klo-text mb-2">
            Key Concerns
          </label>
          <div className="grid grid-cols-2 gap-2">
            {KEY_CONCERNS.map((concern) => {
              const selected = preferences.concerns.includes(concern);
              return (
                <label
                  key={concern}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selected
                      ? "border-[#68E9FA]/50 bg-[#68E9FA]/10"
                      : "border-klo-slate bg-klo-dark hover:border-[#68E9FA]/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleConcern(concern)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selected
                        ? "bg-[#68E9FA] border-[#68E9FA]"
                        : "border-klo-slate bg-transparent"
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 text-[#022886]" />}
                  </div>
                  <span
                    className={`text-sm ${
                      selected ? "text-klo-text" : "text-klo-muted"
                    }`}
                  >
                    {concern}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={prev}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-[#022886] border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Policy
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display text-klo-text">
            Your Generated Policy
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={copyToClipboard}>
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Styled markdown container */}
        <Card className="max-h-[28rem] overflow-y-auto scrollbar-thin">
          <div className="prose prose-invert prose-sm max-w-none policy-content">
            {generatedPolicy.split("\n").map((line, i) => {
              if (line.startsWith("# ")) {
                return (
                  <h1
                    key={i}
                    className="text-xl font-display text-[#68E9FA] mt-0 mb-3"
                  >
                    {line.replace("# ", "")}
                  </h1>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h2
                    key={i}
                    className="text-lg font-display text-klo-text mt-6 mb-2"
                  >
                    {line.replace("## ", "")}
                  </h2>
                );
              }
              if (line.startsWith("### ")) {
                return (
                  <h3
                    key={i}
                    className="text-base font-display text-klo-text mt-4 mb-1"
                  >
                    {line.replace("### ", "")}
                  </h3>
                );
              }
              if (line.startsWith("- ")) {
                return (
                  <p key={i} className="text-klo-muted text-sm pl-4 my-0.5">
                    <span className="text-[#68E9FA] mr-2">&bull;</span>
                    {line.replace("- ", "")}
                  </p>
                );
              }
              if (line.startsWith("| ")) {
                return (
                  <p
                    key={i}
                    className="text-klo-muted text-sm font-mono my-0.5"
                  >
                    {line}
                  </p>
                );
              }
              if (line.startsWith("---")) {
                return (
                  <hr key={i} className="border-klo-slate my-4" />
                );
              }
              if (line.startsWith("*") && line.endsWith("*")) {
                return (
                  <p key={i} className="text-klo-muted/70 text-xs italic mt-4">
                    {line.replace(/\*/g, "")}
                  </p>
                );
              }
              if (line.trim() === "") {
                return <div key={i} className="h-2" />;
              }
              return (
                <p key={i} className="text-klo-muted text-sm my-1">
                  {line}
                </p>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="ghost" onClick={prev}>
            <ChevronLeft className="w-4 h-4" /> Edit Preferences
          </Button>
          <div className="flex-1" />
          <Button href="/consult">
            <CalendarCheck className="w-4 h-4" /> Request Custom Review by
            Keith L. Odom
          </Button>
        </div>
      </div>
    );
  }

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4];

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <section className="w-full max-w-2xl mx-auto">
      <StepIndicator current={step} />

      <Card className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {stepRenderers[step]()}
          </motion.div>
        </AnimatePresence>
      </Card>
    </section>
  );
}
