/**
 * POST /api/auth/mfa/disable
 *
 * Disables MFA for the authenticated user. Requires a valid TOTP code
 * or backup code to prevent an attacker who has stolen a session from
 * silently disabling MFA.
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { checkLimit, getClientIp, mfaVerifyLimiter } from "@/lib/ratelimit";
import { decryptSecret, verifyTotpCode, verifyBackupCode } from "@/lib/mfa";
import { logError, logRequest } from "@/lib/logger";

const BodySchema = z.object({
  code: z
    .string()
    .min(1)
    .max(12)
    .transform((v) => v.replace(/\s/g, "")),
});

export async function POST(req: Request) {
  logRequest(req);
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "No user ID in session" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const { allowed } = await checkLimit(mfaVerifyLimiter, ip);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const result = BodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { code } = result.data;

  const supabase = getServiceSupabase();
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("mfa_enabled, mfa_secret, mfa_backup_codes")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    logError(fetchError ?? new Error('Profile not found'), { endpoint: '/api/auth/mfa/disable', context: 'fetch' });
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  if (!profile.mfa_enabled || !profile.mfa_secret) {
    return NextResponse.json({ error: "MFA is not enabled" }, { status: 400 });
  }

  let verified = false;

  if (code.length === 6 && /^\d{6}$/.test(code)) {
    let plainSecret: string;
    try {
      plainSecret = decryptSecret(profile.mfa_secret);
    } catch (decryptErr) {
      logError(decryptErr, { endpoint: '/api/auth/mfa/disable', context: 'decrypt', userId });
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
    verified = verifyTotpCode(plainSecret, code);
  }

  if (!verified && profile.mfa_backup_codes?.length) {
    const matchIndex = await verifyBackupCode(code, profile.mfa_backup_codes);
    if (matchIndex >= 0) verified = true;
  }

  if (!verified) {
    console.warn(`[MFA] Failed disable attempt for user ${userId}`);
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      mfa_enabled: false,
      mfa_secret: null,
      mfa_backup_codes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    logError(updateError, { endpoint: '/api/auth/mfa/disable' });
    return NextResponse.json({ error: "Failed to disable MFA" }, { status: 500 });
  }

  console.info(`[MFA] Disabled for user ${userId}`);
  return NextResponse.json({ disabled: true });
}
