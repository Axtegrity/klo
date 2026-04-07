import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase";
import { resend } from "@/lib/email";
import { registerLimiter, checkLimit, getClientIp } from "@/lib/ratelimit";
import crypto from "crypto";
import { registerSchema } from "@/lib/validation";
import { logError, logRequest } from "@/lib/logger";

export async function POST(request: Request) {
  logRequest(request);
  try {
    // Rate limit: 5 per minute per IP
    const ip = getClientIp(request);
    const { allowed } = await checkLimit(registerLimiter, ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      const msg =
        firstError?.path[0] === "email"
          ? "Valid email is required"
          : firstError?.path[0] === "password"
            ? "Password must be at least 8 characters"
            : "Invalid request";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { email, password, full_name } = parsed.data;

    const supabase = getServiceSupabase();

    // Check for existing email
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await hash(password, 12);

    // Insert profile (subscription_tier defaults to 'free' in DB)
    const { error: insertError } = await supabase.from("profiles").insert({
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      password_hash,
      full_name: full_name?.trim() || null,
      role: "user",
    });

    if (insertError) {
      logError(insertError, { endpoint: '/api/auth/register' });
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Notify Keith + Tim of new sign-up
    try {
      await resend.emails.send({
        from: "KLO Advisory <notifications@keithlodom.ai>",
        to: (process.env.ADMIN_NOTIFICATION_EMAILS ?? "").split(",").filter(Boolean),
        subject: `New User Sign-Up — ${email.toLowerCase()}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;padding:32px;border-radius:12px;">
            <h1 style="color:#C9A84C;font-size:24px;">New User Registration</h1>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;">
              <tr><td style="padding:6px 12px;font-weight:600;color:#999;">Name</td><td style="padding:6px 12px;color:#fff;">${full_name?.trim() || "Not provided"}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:600;color:#999;">Email</td><td style="padding:6px 12px;color:#fff;">${email.toLowerCase()}</td></tr>
            </table>
          </div>
        `,
      });
    } catch {
      // Don't fail registration if email fails
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logError(error, { endpoint: '/api/auth/register' });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
