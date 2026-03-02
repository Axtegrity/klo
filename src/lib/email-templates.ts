/* ------------------------------------------------------------------ */
/*  KLO Advisory — Rich HTML Email Templates                          */
/* ------------------------------------------------------------------ */

const BRAND = {
  gold: "#C8A84E",
  dark: "#0A1628",
  navy: "#111D33",
  slate: "#1C2A3F",
  text: "#E2E8F0",
  muted: "#94A3B8",
  white: "#FFFFFF",
};

/* ------------------------------------------------------------------ */
/*  Shared layout helpers                                              */
/* ------------------------------------------------------------------ */

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KLO Advisory</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.dark};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${BRAND.text};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.dark};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.navy};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.slate};">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.dark} 0%,${BRAND.navy} 100%);padding:32px 40px;text-align:center;border-bottom:2px solid ${BRAND.gold};">
              <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:2px;color:${BRAND.gold};font-family:Georgia,'Times New Roman',serif;">KLO</h1>
              <p style="margin:4px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.muted};">Advisory &amp; Intelligence</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND.dark};padding:32px 40px;border-top:1px solid ${BRAND.slate};text-align:center;">
              <p style="margin:0 0 16px;font-size:13px;color:${BRAND.muted};">
                <a href="https://keithlodom.io" style="color:${BRAND.gold};text-decoration:none;">Website</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="https://linkedin.com/company/kloadvisory" style="color:${BRAND.gold};text-decoration:none;">LinkedIn</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="https://twitter.com/kloadvisory" style="color:${BRAND.gold};text-decoration:none;">X / Twitter</a>
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:${BRAND.muted};">
                &copy; ${new Date().getFullYear()} KLO Advisory. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:${BRAND.muted};">
                <a href="{{unsubscribe_url}}" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe</a>
                &nbsp;|&nbsp;
                <a href="{{preferences_url}}" style="color:${BRAND.muted};text-decoration:underline;">Email Preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, href: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td align="center" style="background-color:${BRAND.gold};border-radius:10px;">
      <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:${BRAND.dark};text-decoration:none;letter-spacing:0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

function secondaryButton(text: string, href: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td align="center" style="border:2px solid ${BRAND.gold};border-radius:10px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:${BRAND.gold};text-decoration:none;letter-spacing:0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BRAND.slate};margin:28px 0;" />`;
}

/* ------------------------------------------------------------------ */
/*  1. Welcome Email                                                   */
/* ------------------------------------------------------------------ */

export function welcomeEmail(name: string): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;">
      Welcome to KLO, ${name}!
    </h2>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${BRAND.text};">
      You've joined an exclusive community of forward-thinking leaders who leverage AI intelligence to drive strategic advantage. Here's what you can access right away:
    </p>

    <!-- CTA Block 1 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background-color:${BRAND.dark};border-radius:12px;border:1px solid ${BRAND.slate};">
      <tr>
        <td style="padding:24px;">
          <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:${BRAND.gold};font-family:Georgia,'Times New Roman',serif;">
            &#128202; Take an Assessment
          </h3>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.muted};">
            Measure your organization's AI readiness with our proprietary assessment framework. Get a detailed maturity score and actionable recommendations.
          </p>
          ${ctaButton("Start Assessment", "https://keithlodom.io/assessments")}
        </td>
      </tr>
    </table>

    <!-- CTA Block 2 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background-color:${BRAND.dark};border-radius:12px;border:1px solid ${BRAND.slate};">
      <tr>
        <td style="padding:24px;">
          <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:${BRAND.gold};font-family:Georgia,'Times New Roman',serif;">
            &#128451; Explore the Vault
          </h3>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.muted};">
            Access curated strategy resources, frameworks, and executive playbooks designed to accelerate your AI transformation.
          </p>
          ${ctaButton("Open the Vault", "https://keithlodom.io/vault")}
        </td>
      </tr>
    </table>

    <!-- CTA Block 3 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;background-color:${BRAND.dark};border-radius:12px;border:1px solid ${BRAND.slate};">
      <tr>
        <td style="padding:24px;">
          <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:${BRAND.gold};font-family:Georgia,'Times New Roman',serif;">
            &#129302; Ask the AI Advisor
          </h3>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.muted};">
            Get instant, tailored strategic advice from our AI-powered advisor. Ask about adoption strategies, risk management, or implementation roadmaps.
          </p>
          ${ctaButton("Chat with Advisor", "https://keithlodom.io/advisor")}
        </td>
      </tr>
    </table>

    ${divider()}

    <p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.muted};text-align:center;">
      Questions? Reply to this email or reach out at
      <a href="mailto:support@keithlodom.io" style="color:${BRAND.gold};text-decoration:none;">support@keithlodom.io</a>.
    </p>
  `;

  return {
    subject: `Welcome to KLO Advisory, ${name}!`,
    html: emailWrapper(content),
  };
}

/* ------------------------------------------------------------------ */
/*  2. Assessment Report Email                                         */
/* ------------------------------------------------------------------ */

export function assessmentReportEmail(
  name: string,
  assessmentType: string,
  score: number,
  recommendations: string[]
): { subject: string; html: string } {
  const clampedScore = Math.max(0, Math.min(100, score));

  let maturityLevel: string;
  let maturityColor: string;
  if (clampedScore >= 80) {
    maturityLevel = "Leader";
    maturityColor = "#22C55E";
  } else if (clampedScore >= 60) {
    maturityLevel = "Advanced";
    maturityColor = "#D4A853";
  } else if (clampedScore >= 40) {
    maturityLevel = "Developing";
    maturityColor = BRAND.gold;
  } else if (clampedScore >= 20) {
    maturityLevel = "Emerging";
    maturityColor = "#F97316";
  } else {
    maturityLevel = "Beginning";
    maturityColor = "#EF4444";
  }

  const recommendationsHtml = recommendations
    .map(
      (r, i) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.slate};">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background-color:${BRAND.gold};color:${BRAND.dark};border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;vertical-align:middle;">
              ${i + 1}
            </span>
            <span style="font-size:14px;line-height:1.6;color:${BRAND.text};vertical-align:middle;">
              ${r}
            </span>
          </td>
        </tr>`
    )
    .join("");

  const content = `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;">
      Your ${assessmentType} Results
    </h2>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${BRAND.text};">
      Hi ${name}, your assessment is complete. Here is a summary of your results.
    </p>

    <!-- Score Display -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background-color:${BRAND.dark};border-radius:12px;border:1px solid ${BRAND.slate};">
      <tr>
        <td style="padding:28px;text-align:center;">
          <p style="margin:0 0 4px;font-size:48px;font-weight:800;color:${BRAND.gold};font-family:Georgia,'Times New Roman',serif;">
            ${clampedScore}<span style="font-size:20px;color:${BRAND.muted};">/100</span>
          </p>
          <p style="margin:0 0 20px;font-size:14px;font-weight:600;color:${maturityColor};text-transform:uppercase;letter-spacing:1px;">
            ${maturityLevel} Maturity
          </p>
          <!-- Score Bar -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 20px;">
                <div style="width:100%;height:10px;background-color:${BRAND.slate};border-radius:5px;overflow:hidden;">
                  <div style="width:${clampedScore}%;height:10px;background:linear-gradient(90deg,${BRAND.gold},${maturityColor});border-radius:5px;"></div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Recommendations -->
    <h3 style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;">
      Key Recommendations
    </h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background-color:${BRAND.dark};border-radius:12px;border:1px solid ${BRAND.slate};overflow:hidden;">
      ${recommendationsHtml}
    </table>

    <!-- CTAs -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:12px;">
          ${ctaButton("View Full Report", "https://keithlodom.io/assessments")}
        </td>
      </tr>
      <tr>
        <td align="center">
          ${secondaryButton("Book a Strategy Session", "https://keithlodom.io/booking")}
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Your ${assessmentType} Results — KLO Advisory`,
    html: emailWrapper(content),
  };
}

/* ------------------------------------------------------------------ */
/*  3. Booking Confirmation Email                                      */
/* ------------------------------------------------------------------ */

export function bookingConfirmationEmail(
  name: string,
  eventName: string,
  eventDate: string,
  eventType: string
): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;">
      Booking Inquiry Received
    </h2>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${BRAND.text};">
      Hi ${name}, thank you for your interest! We've received your booking inquiry and our team will review it shortly.
    </p>

    <!-- Booking Summary Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background-color:${BRAND.dark};border-radius:12px;border:1px solid ${BRAND.slate};overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid ${BRAND.slate};">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${BRAND.muted};font-weight:600;">Booking Details</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:14px 24px;border-bottom:1px solid ${BRAND.slate};width:35%;font-size:13px;color:${BRAND.muted};font-weight:600;">Event</td>
              <td style="padding:14px 24px;border-bottom:1px solid ${BRAND.slate};font-size:14px;color:${BRAND.text};">${eventName}</td>
            </tr>
            <tr>
              <td style="padding:14px 24px;border-bottom:1px solid ${BRAND.slate};width:35%;font-size:13px;color:${BRAND.muted};font-weight:600;">Type</td>
              <td style="padding:14px 24px;border-bottom:1px solid ${BRAND.slate};font-size:14px;color:${BRAND.text};">${eventType}</td>
            </tr>
            <tr>
              <td style="padding:14px 24px;width:35%;font-size:13px;color:${BRAND.muted};font-weight:600;">Requested Date</td>
              <td style="padding:14px 24px;font-size:14px;color:${BRAND.text};">${eventDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- What's Next -->
    <h3 style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;">
      What&rsquo;s Next
    </h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:0 0 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background-color:${BRAND.gold};color:${BRAND.dark};border-radius:50%;font-size:13px;font-weight:700;">1</span>
              </td>
              <td style="vertical-align:top;padding-top:4px;font-size:14px;line-height:1.6;color:${BRAND.text};">
                Our team reviews your inquiry and checks availability.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background-color:${BRAND.gold};color:${BRAND.dark};border-radius:50%;font-size:13px;font-weight:700;">2</span>
              </td>
              <td style="vertical-align:top;padding-top:4px;font-size:14px;line-height:1.6;color:${BRAND.text};">
                You'll receive a confirmation or alternative options via email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background-color:${BRAND.gold};color:${BRAND.dark};border-radius:50%;font-size:13px;font-weight:700;">3</span>
              </td>
              <td style="vertical-align:top;padding-top:4px;font-size:14px;line-height:1.6;color:${BRAND.text};">
                Once confirmed, you'll get a calendar invite with meeting details.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.dark};border-radius:10px;border:1px solid ${BRAND.gold}33;margin-bottom:8px;">
      <tr>
        <td style="padding:16px 24px;text-align:center;">
          <p style="margin:0;font-size:14px;color:${BRAND.gold};font-weight:600;">
            We'll respond within 2 business days.
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Booking Inquiry Received — ${eventName}`,
    html: emailWrapper(content),
  };
}

/* ------------------------------------------------------------------ */
/*  4. Weekly Digest Email                                             */
/* ------------------------------------------------------------------ */

export function weeklyDigestEmail(
  name: string,
  posts: { title: string; category: string; excerpt: string }[]
): { subject: string; html: string } {
  const categoryColors: Record<string, string> = {
    Strategy: "#D4A853",
    Technology: "#8B5CF6",
    Leadership: BRAND.gold,
    Research: "#22C55E",
    Industry: "#F97316",
  };

  const postsHtml = posts
    .map((post) => {
      const color = categoryColors[post.category] || BRAND.gold;
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background-color:${BRAND.dark};border-radius:12px;border:1px solid ${BRAND.slate};overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;">
              <span style="display:inline-block;padding:4px 12px;font-size:11px;font-weight:600;color:${color};background-color:${color}22;border-radius:20px;border:1px solid ${color}44;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
                ${post.category}
              </span>
              <h3 style="margin:10px 0 8px;font-size:16px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;">
                ${post.title}
              </h3>
              <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">
                ${post.excerpt}
              </p>
            </td>
          </tr>
        </table>`;
    })
    .join("");

  const content = `
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;">
      Your Weekly Intelligence Briefing
    </h2>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${BRAND.text};">
      Hi ${name}, here are this week's top insights curated for you.
    </p>

    ${postsHtml}

    <div style="text-align:center;padding-top:12px;">
      ${ctaButton("Read Full Feed", "https://keithlodom.io/feed")}
    </div>
  `;

  return {
    subject: "Your Weekly Intelligence Briefing — KLO Advisory",
    html: emailWrapper(content),
  };
}

/* ------------------------------------------------------------------ */
/*  5. Upgrade Confirmation Email                                      */
/* ------------------------------------------------------------------ */

export function upgradeEmail(
  name: string,
  tier: "pro" | "executive"
): { subject: string; html: string } {
  const tierLabel = tier === "pro" ? "Pro" : "Executive";
  const tierColor = tier === "pro" ? BRAND.gold : "#E8D5A0";

  const featuresMap: Record<string, string[]> = {
    pro: [
      "All assessments with detailed reports and PDF exports",
      "Unlimited AI Advisor conversations",
      "Full Strategy Vault access with premium resources",
      "Complete Executive Feed with all posts",
      "Priority support from the KLO team",
    ],
    executive: [
      "Everything in Pro, plus exclusive features",
      "1-on-1 advisory sessions with Keith L. Odom",
      "Custom assessment frameworks for your organization",
      "Organization-wide dashboards and analytics",
      "Executive briefing documents tailored to you",
      "White-glove onboarding experience",
    ],
  };

  const quickStartMap: Record<string, { title: string; desc: string; href: string }[]> = {
    pro: [
      { title: "Run a Full Assessment", desc: "Take any assessment to receive your detailed maturity report with PDF export.", href: "https://keithlodom.io/assessments" },
      { title: "Explore Premium Vault", desc: "Browse strategy frameworks and resources now available to you.", href: "https://keithlodom.io/vault" },
      { title: "Chat Unlimited", desc: "Ask the AI Advisor anything — no more monthly limits.", href: "https://keithlodom.io/advisor" },
    ],
    executive: [
      { title: "Book Your Advisory Session", desc: "Schedule your first 1-on-1 session with Keith L. Odom.", href: "https://keithlodom.io/booking" },
      { title: "Set Up Your Dashboard", desc: "Configure your organization-wide analytics dashboard.", href: "https://keithlodom.io/profile" },
      { title: "Access Executive Briefings", desc: "Download your first tailored executive briefing document.", href: "https://keithlodom.io/vault" },
    ],
  };

  const features = featuresMap[tier];
  const quickStart = quickStartMap[tier];

  const featuresHtml = features
    .map(
      (f) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid ${BRAND.slate};">
          <span style="color:${tierColor};margin-right:8px;">&#10003;</span>
          <span style="font-size:14px;color:${BRAND.text};">${f}</span>
        </td>
      </tr>`
    )
    .join("");

  const quickStartHtml = quickStart
    .map(
      (item, i) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background-color:${BRAND.dark};border-radius:10px;border:1px solid ${BRAND.slate};">
        <tr>
          <td style="padding:20px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:top;padding-right:14px;">
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background-color:${tierColor};color:${BRAND.dark};border-radius:50%;font-size:13px;font-weight:700;">${i + 1}</span>
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${BRAND.white};">${item.title}</p>
                  <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.muted};">${item.desc}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    )
    .join("");

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <span style="display:inline-block;padding:6px 20px;font-size:12px;font-weight:700;color:${tierColor};background-color:${tierColor}22;border-radius:20px;border:1px solid ${tierColor}44;text-transform:uppercase;letter-spacing:1px;">
        ${tierLabel} Member
      </span>
    </div>

    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;text-align:center;">
      Welcome to ${tierLabel}!
    </h2>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${BRAND.text};text-align:center;">
      Congratulations, ${name}! Your account has been upgraded. Here's everything you've unlocked.
    </p>

    <!-- Unlocked Features -->
    <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;">
      Newly Unlocked Features
    </h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background-color:${BRAND.dark};border-radius:12px;border:1px solid ${BRAND.slate};overflow:hidden;">
      ${featuresHtml}
    </table>

    <!-- Quick Start Guide -->
    <h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:${BRAND.white};font-family:Georgia,'Times New Roman',serif;">
      Quick Start Guide
    </h3>
    ${quickStartHtml}

    <div style="text-align:center;padding-top:16px;">
      ${ctaButton("Go to Dashboard", "https://keithlodom.io/profile")}
    </div>
  `;

  return {
    subject: `Welcome to KLO ${tierLabel}!`,
    html: emailWrapper(content),
  };
}
