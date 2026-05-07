import { Resend } from "resend";
import {
  welcomeEmail,
  assessmentReportEmail,
  bookingConfirmationEmail,
  weeklyDigestEmail,
  upgradeEmail,
} from "./email-templates";

/* ------------------------------------------------------------------ */
/*  Resend client                                                      */
/* ------------------------------------------------------------------ */

export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

const FROM_ADDRESS = "KLO Advisory <notifications@keithlodom.ai>";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmailResult {
  id: string;
  success: boolean;
}

interface WelcomeEmailParams {
  to: string;
  name: string;
}

interface AssessmentReportParams {
  to: string;
  name: string;
  assessmentType: string;
  score: number;
  recommendations: string[];
}

interface BookingConfirmationParams {
  to: string;
  name: string;
  date: string;
  time: string;
  sessionType: string;
}

interface WeeklyDigestParams {
  to: string;
  name: string;
  posts: { title: string; category: string; excerpt: string }[];
}

interface UpgradeConfirmationParams {
  to: string;
  name: string;
  tier: "pro" | "executive";
}

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

async function send(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { id: data?.id ?? "", success: true };
}

/* ------------------------------------------------------------------ */
/*  Email sender functions                                             */
/* ------------------------------------------------------------------ */

/**
 * Send a welcome email to a newly registered user.
 */
export async function sendWelcomeEmail(
  params: WelcomeEmailParams
): Promise<EmailResult> {
  const { subject, html } = welcomeEmail(params.name);
  return send(params.to, subject, html);
}

/**
 * Send an assessment report summary to the user.
 */
export async function sendAssessmentReport(
  params: AssessmentReportParams
): Promise<EmailResult> {
  const { subject, html } = assessmentReportEmail(
    params.name,
    params.assessmentType,
    params.score,
    params.recommendations
  );
  return send(params.to, subject, html);
}

/**
 * Send a booking confirmation email.
 */
export async function sendBookingConfirmation(
  params: BookingConfirmationParams
): Promise<EmailResult> {
  const { subject, html } = bookingConfirmationEmail(
    params.name,
    params.sessionType,
    params.date,
    params.sessionType
  );
  return send(params.to, subject, html);
}

/**
 * Send a weekly digest email with curated posts.
 */
export async function sendWeeklyDigest(
  params: WeeklyDigestParams
): Promise<EmailResult> {
  const { subject, html } = weeklyDigestEmail(params.name, params.posts);
  return send(params.to, subject, html);
}

/**
 * Send an upgrade confirmation email when a user upgrades their tier.
 */
export async function sendUpgradeConfirmation(
  params: UpgradeConfirmationParams
): Promise<EmailResult> {
  const { subject, html } = upgradeEmail(params.name, params.tier);
  return send(params.to, subject, html);
}

/**
 * Send a Strategy Room registration confirmation email.
 * Catches and logs all errors — never throws.
 */
export async function sendStrategyRoomConfirmation({
  to,
  name,
  sessionTitle,
  sessionDate,
  sessionTime,
  facilitator,
  tier,
}: {
  to: string;
  name?: string | null;
  sessionTitle: string;
  sessionDate?: string | null;
  sessionTime?: string | null;
  facilitator?: string | null;
  tier: "pro" | "executive";
}): Promise<void> {
  try {
    const displayName = name ?? "Leader";
    const tierLabel = tier === "executive" ? "Executive" : "Pro";
    const subject = `You're registered: ${sessionTitle}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0D1117;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#161B22;border:1px solid #21262D;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#E6EDF3;">
        Registration Confirmed
      </h1>
      <p style="margin:0 0 24px;color:#8B949E;font-size:15px;">
        Hi ${displayName}, you're registered for the following Strategy Room session:
      </p>

      <div style="background:#0D1117;border:1px solid #21262D;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:inline-block;padding:4px 10px;background:${tier === "executive" ? "rgba(200,168,78,0.15)" : "rgba(39,100,255,0.15)"};border-radius:999px;color:${tier === "executive" ? "#C8A84E" : "#4D8DFF"};font-size:12px;font-weight:600;margin-bottom:12px;">
          ${tierLabel} Session
        </div>
        <h2 style="margin:0 0 12px;font-size:17px;font-weight:600;color:#E6EDF3;">${sessionTitle}</h2>
        ${sessionDate ? `<p style="margin:0 0 4px;color:#8B949E;font-size:14px;">Date: <span style="color:#21B8CD">${sessionDate}</span></p>` : ""}
        ${sessionTime ? `<p style="margin:0 0 4px;color:#8B949E;font-size:14px;">Time: <span style="color:#E6EDF3">${sessionTime}</span></p>` : ""}
        ${facilitator ? `<p style="margin:0;color:#8B949E;font-size:14px;">Facilitator: <span style="color:#E6EDF3">${facilitator}</span></p>` : ""}
      </div>

      <p style="margin:0 0 8px;color:#8B949E;font-size:14px;line-height:1.6;">
        We look forward to seeing you there. Visit your Strategy Rooms dashboard to manage your registration or access session details.
      </p>

      <a href="https://app.keithlodom.io/strategy-rooms" style="display:inline-block;margin-top:20px;padding:12px 24px;background:linear-gradient(135deg,#2764FF,#21B8CD);color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:700;">
        View Strategy Rooms
      </a>
    </div>

    <p style="margin:20px 0 0;text-align:center;color:#484F58;font-size:12px;">
      KLO Advisory &bull; <a href="https://app.keithlodom.io" style="color:#484F58;">app.keithlodom.io</a>
    </p>
  </div>
</body>
</html>
    `.trim();

    await send(to, subject, html);
  } catch (err) {
    console.error("[sendStrategyRoomConfirmation]", err);
    // Never throw — email is best-effort
  }
}
