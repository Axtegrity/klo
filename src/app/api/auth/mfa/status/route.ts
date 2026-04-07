/**
 * GET /api/auth/mfa/status
 *
 * Returns whether MFA is currently enabled for the authenticated user.
 * Used by the settings page to show the correct MFA toggle state.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { logError, logRequest } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logRequest(req);
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "No user ID in session" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("mfa_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    logError(error, { endpoint: '/api/auth/mfa/status' });
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  return NextResponse.json({ mfaEnabled: profile?.mfa_enabled ?? false });
}
