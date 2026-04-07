/**
 * POST /api/auth/mfa/verify
 *
 * Called from the MFA challenge page (/auth/mfa-verify) after credentials
 * login. Verifies a TOTP code or backup code, then clears the mfa_pending
 * flag from the NextAuth JWT by returning a signal the client uses to
 * re-trigger session refresh.
 *
 * The mfa_pending flag lives in the JWT. To clear it we return
 * { verified: true } and the client calls NextAuth's update() to
 * force a JWT reissue — the jwt callback reads mfa_pending from the
 * updated token payload.
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
    logError(fetchError ?? new Error('Profile not found'), { endpoint: '/api/auth/mfa/verify', context: 'fetch' });
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  if (!profile.mfa_enabled || !profile.mfa_secret) {
    return NextResponse.json({ error: "MFA is not enabled" }, { status: 400 });
  }

  let verified = false;

  // Try TOTP first
  if (code.length === 6 && /^\d{6}$/.test(code)) {
    let plainSecret: string;
    try {
      plainSecret = decryptSecret(profile.mfa_secret);
    } catch (decryptErr) {
      logError(decryptErr, { endpoint: '/api/auth/mfa/verify', context: 'decrypt', userId });
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
    verified = verifyTotpCode(plainSecret, code);
  }

  // Try backup code if TOTP failed or code length indicates backup code
  if (!verified && profile.mfa_backup_codes?.length) {
    const matchIndex = await verifyBackupCode(code, profile.mfa_backup_codes);
    if (matchIndex >= 0) {
      verified = true;
      // Consume the used backup code (remove it from the array)
      const remaining = profile.mfa_backup_codes.filter((_: string, i: number) => i !== matchIndex);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ mfa_backup_codes: remaining, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (updateError) {
        logError(updateError, { endpoint: '/api/auth/mfa/verify', context: 'backup_code_consume' });
      }
      console.info(`[MFA] Backup code used by user ${userId} — ${remaining.length} remaining`);
    }
  }

  if (!verified) {
    console.warn(`[MFA] Failed verification attempt for user ${userId}`);
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  console.info(`[MFA] Verified for user ${userId}`);
  return NextResponse.json({ verified: true });
}
