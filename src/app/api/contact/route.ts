import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/email";

/* ------------------------------------------------------------------ */
/*  Simple in-memory rate limiter: 3 submissions per hour per IP       */
/* ------------------------------------------------------------------ */

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];

  // Remove entries older than the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

/* ------------------------------------------------------------------ */
/*  Validation                                                          */
/* ------------------------------------------------------------------ */

interface ContactFormData {
  type?: "booking" | "consultation";
  name: string;
  email: string;
  organization?: string;
  eventName: string;
  eventDate?: string;
  eventType: string;
  message?: string;
  budgetRange?: string;
  audienceSize?: string;
}

interface ConsultFormData {
  type: "consultation";
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  industry: string;
  location?: string;
  areaOfInterest: string;
  organizationName: string;
  organizationSize: string;
  currentChallenge: string;
  timeline: string;
  previousConsultant: string;
  additionalDetails?: string;
}

function validateConsultForm(data: unknown): {
  valid: boolean;
  errors: string[];
  parsed?: ConsultFormData;
} {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Invalid form data."] };
  }

  const d = data as Record<string, unknown>;

  if (!d.firstName || typeof d.firstName !== "string" || (d.firstName as string).trim().length < 2) {
    errors.push("First name is required.");
  }
  if (!d.lastName || typeof d.lastName !== "string" || (d.lastName as string).trim().length < 2) {
    errors.push("Last name is required.");
  }
  if (!d.email || typeof d.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email as string)) {
    errors.push("A valid email address is required.");
  }
  if (!d.phone || typeof d.phone !== "string") {
    errors.push("Phone number is required.");
  }
  if (!d.industry || typeof d.industry !== "string") {
    errors.push("Industry is required.");
  }
  if (!d.areaOfInterest || typeof d.areaOfInterest !== "string") {
    errors.push("Area of interest is required.");
  }
  if (!d.organizationName || typeof d.organizationName !== "string") {
    errors.push("Organization name is required.");
  }
  if (!d.organizationSize || typeof d.organizationSize !== "string") {
    errors.push("Organization size is required.");
  }
  if (!d.currentChallenge || typeof d.currentChallenge !== "string") {
    errors.push("Current challenge is required.");
  }
  if (!d.timeline || typeof d.timeline !== "string") {
    errors.push("Timeline is required.");
  }
  if (!d.previousConsultant || typeof d.previousConsultant !== "string") {
    errors.push("Previous consultant experience is required.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    parsed: {
      type: "consultation",
      name: `${(d.firstName as string).trim()} ${(d.lastName as string).trim()}`,
      firstName: (d.firstName as string).trim(),
      lastName: (d.lastName as string).trim(),
      email: (d.email as string).trim(),
      phone: (d.phone as string).trim(),
      industry: (d.industry as string).trim(),
      location: d.location ? (d.location as string).trim() : undefined,
      areaOfInterest: (d.areaOfInterest as string).trim(),
      organizationName: (d.organizationName as string).trim(),
      organizationSize: (d.organizationSize as string).trim(),
      currentChallenge: (d.currentChallenge as string).trim(),
      timeline: (d.timeline as string).trim(),
      previousConsultant: (d.previousConsultant as string).trim(),
      additionalDetails: d.additionalDetails ? (d.additionalDetails as string).trim() : undefined,
    },
  };
}

function validateForm(data: unknown): {
  valid: boolean;
  errors: string[];
  parsed?: ContactFormData;
} {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Invalid form data."] };
  }

  const d = data as Record<string, unknown>;

  if (!d.name || typeof d.name !== "string" || d.name.trim().length < 2) {
    errors.push("Full name is required (at least 2 characters).");
  }

  if (
    !d.email ||
    typeof d.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)
  ) {
    errors.push("A valid email address is required.");
  }

  if (
    !d.eventName ||
    typeof d.eventName !== "string" ||
    d.eventName.trim().length < 2
  ) {
    errors.push("Event name is required.");
  }

  if (!d.eventType || typeof d.eventType !== "string") {
    errors.push("Event type is required.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    parsed: {
      name: (d.name as string).trim(),
      email: (d.email as string).trim(),
      organization: d.organization
        ? (d.organization as string).trim()
        : undefined,
      eventName: (d.eventName as string).trim(),
      eventDate: d.eventDate ? (d.eventDate as string).trim() : undefined,
      eventType: (d.eventType as string).trim(),
      message: d.message ? (d.message as string).trim() : undefined,
      budgetRange: d.budgetRange
        ? (d.budgetRange as string).trim()
        : undefined,
      audienceSize: d.audienceSize
        ? (d.audienceSize as string).trim()
        : undefined,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                        */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many submissions. Please wait before submitting again.",
        },
        { status: 429 }
      );
    }

    // Parse and validate
    const body = await req.json();
    const isConsultation = body?.type === "consultation";

    if (isConsultation) {
      const { valid, errors, parsed } = validateConsultForm(body);

      if (!valid || !parsed) {
        return NextResponse.json(
          { success: false, message: errors.join(" ") },
          { status: 400 }
        );
      }

      // Demo mode
      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({
          success: true,
          message:
            "Thank you for your consultation request! Our team will review it and respond within 2 business days.",
        });
      }

      // Build consultation detail rows
      const row = (label: string, value: string) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#999;">${label}</td><td style="padding:6px 12px;color:#fff;">${value}</td></tr>`;

      const consultRows = [
        row("Name", parsed.name),
        row("Email", parsed.email),
        row("Phone", parsed.phone),
        row("Industry", parsed.industry),
        parsed.location ? row("Location", parsed.location) : "",
        row("Area of Interest", parsed.areaOfInterest),
        row("Organization", parsed.organizationName),
        row("Organization Size", parsed.organizationSize),
        row("Timeline", parsed.timeline),
        row("Previous Consultant", parsed.previousConsultant),
      ].filter(Boolean).join("");

      const challengeSection = `<h3 style="color:#C9A84C;margin-top:24px;">Current Challenge</h3><p style="color:#ddd;line-height:1.6;">${parsed.currentChallenge}</p>`;

      const additionalSection = parsed.additionalDetails
        ? `<h3 style="color:#C9A84C;margin-top:24px;">Additional Details</h3><p style="color:#ddd;line-height:1.6;">${parsed.additionalDetails}</p>`
        : "";

      // Send notification to Keith + Tim
      await resend.emails.send({
        from: "KLO Advisory <onboarding@resend.dev>",
        to: (process.env.ADMIN_NOTIFICATION_EMAILS ?? "").split(",").filter(Boolean),
        subject: `New Consultation Request — ${parsed.areaOfInterest}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;padding:32px;border-radius:12px;">
            <h1 style="color:#C9A84C;font-size:24px;">New Consultation Request</h1>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;">
              ${consultRows}
            </table>
            ${challengeSection}
            ${additionalSection}
          </div>
        `,
      });

      // Send confirmation to requester
      await resend.emails.send({
        from: "KLO Advisory <onboarding@resend.dev>",
        to: parsed.email,
        subject: "We Received Your Consultation Request — KLO Advisory",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;padding:32px;border-radius:12px;">
            <h1 style="color:#C9A84C;font-size:24px;">Thank You, ${parsed.firstName}!</h1>
            <p style="color:#ddd;line-height:1.6;">
              We have received your consultation request for <strong>${parsed.areaOfInterest}</strong> and our team is reviewing it now.
            </p>
            <p style="color:#ddd;line-height:1.6;">
              You can expect a response within <strong>2 business days</strong> with availability and next steps.
            </p>
            <p style="color:#999;font-size:13px;margin-top:24px;">
              If you have any urgent questions, reply directly to this email.
            </p>
          </div>
        `,
      });

      return NextResponse.json({
        success: true,
        message:
          "Thank you for your consultation request! Our team will review it and respond within 2 business days.",
      });
    }

    // --- Booking inquiry flow (existing) ---
    const { valid, errors, parsed } = validateForm(body);

    if (!valid || !parsed) {
      return NextResponse.json(
        { success: false, message: errors.join(" ") },
        { status: 400 }
      );
    }

    // Demo mode — skip sending if no API key configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: true,
        message:
          "Thank you for your inquiry! Our team will review it and respond within 2 business days.",
      });
    }

    // Build detail rows for notification email
    const detailRows = [
      `<tr><td style="padding:6px 12px;font-weight:600;color:#999;">Name</td><td style="padding:6px 12px;color:#fff;">${parsed.name}</td></tr>`,
      `<tr><td style="padding:6px 12px;font-weight:600;color:#999;">Email</td><td style="padding:6px 12px;color:#fff;">${parsed.email}</td></tr>`,
      parsed.organization
        ? `<tr><td style="padding:6px 12px;font-weight:600;color:#999;">Organization</td><td style="padding:6px 12px;color:#fff;">${parsed.organization}</td></tr>`
        : "",
      `<tr><td style="padding:6px 12px;font-weight:600;color:#999;">Event</td><td style="padding:6px 12px;color:#fff;">${parsed.eventName}</td></tr>`,
      `<tr><td style="padding:6px 12px;font-weight:600;color:#999;">Type</td><td style="padding:6px 12px;color:#fff;">${parsed.eventType}</td></tr>`,
      parsed.eventDate
        ? `<tr><td style="padding:6px 12px;font-weight:600;color:#999;">Date</td><td style="padding:6px 12px;color:#fff;">${parsed.eventDate}</td></tr>`
        : "",
      parsed.budgetRange
        ? `<tr><td style="padding:6px 12px;font-weight:600;color:#999;">Budget</td><td style="padding:6px 12px;color:#fff;">${parsed.budgetRange}</td></tr>`
        : "",
      parsed.audienceSize
        ? `<tr><td style="padding:6px 12px;font-weight:600;color:#999;">Audience Size</td><td style="padding:6px 12px;color:#fff;">${parsed.audienceSize}</td></tr>`
        : "",
    ]
      .filter(Boolean)
      .join("");

    const messageSection = parsed.message
      ? `<h3 style="color:#C9A84C;margin-top:24px;">Message</h3><p style="color:#ddd;line-height:1.6;">${parsed.message}</p>`
      : "";

    // Send notification to Keith + Tim
    await resend.emails.send({
      from: "KLO Advisory <onboarding@resend.dev>",
      to: (process.env.ADMIN_NOTIFICATION_EMAILS ?? "").split(",").filter(Boolean),
      subject: `New Booking Inquiry — ${parsed.eventName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;padding:32px;border-radius:12px;">
          <h1 style="color:#C9A84C;font-size:24px;">New Booking Inquiry</h1>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            ${detailRows}
          </table>
          ${messageSection}
        </div>
      `,
    });

    // Send confirmation to inquirer
    await resend.emails.send({
      from: "KLO Advisory <onboarding@resend.dev>",
      to: parsed.email,
      subject: "We Received Your Booking Inquiry — KLO Advisory",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;padding:32px;border-radius:12px;">
          <h1 style="color:#C9A84C;font-size:24px;">Thank You, ${parsed.name}!</h1>
          <p style="color:#ddd;line-height:1.6;">
            We have received your booking inquiry for <strong>${parsed.eventName}</strong> and our team is reviewing it now.
          </p>
          <p style="color:#ddd;line-height:1.6;">
            You can expect a response within <strong>2 business days</strong> with availability and next steps.
          </p>
          <p style="color:#999;font-size:13px;margin-top:24px;">
            If you have any urgent questions, reply directly to this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message:
        "Thank you for your inquiry! Our team will review it and respond within 2 business days.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while submitting your inquiry. Please try again later.",
      },
      { status: 500 }
    );
  }
}
