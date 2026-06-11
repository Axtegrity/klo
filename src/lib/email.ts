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

