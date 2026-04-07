/**
 * POST /api/auth/mfa/setup
 *
 * Generates a new TOTP secret and returns the otpauth:// URI so the
 * client can render a QR code. The secret is NOT persisted here — it
 * is stored only after the user confirms setup via /api/auth/mfa/verify-setup.
 *
 * The secret is returned encrypted so it can be round-tripped through
 * the client without being readable in plaintext.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkLimit, getClientIp, mfaSetupLimiter } from "@/lib/ratelimit";
import { generateTotpSecret, buildOtpAuthUri, encryptSecret } from "@/lib/mfa";
import { logRequest } from "@/lib/logger";

export async function POST(req: Request) {
  logRequest(req);
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed } = await checkLimit(mfaSetupLimiter, ip);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const email = session.user.email ?? "user";
  const plainSecret = generateTotpSecret();
  const uri = buildOtpAuthUri(plainSecret, email);
  // Encrypt so it can be safely passed back in verify-setup without
  // ever exposing the plaintext secret to the client.
  const encryptedSecret = encryptSecret(plainSecret);

  return NextResponse.json({ uri, encryptedSecret });
}
