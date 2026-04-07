import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { logError, logRequest } from "@/lib/logger";

export async function GET(request: Request) {
  logRequest(request);
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "No user ID" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, organization_name, organization_type, industry, team_size")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    logError(error, { endpoint: '/api/profile', method: 'GET' });
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  return NextResponse.json(data || {});
}

export async function PUT(req: Request) {
  logRequest(req);
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "No user ID" }, { status: 400 });
  }

  const body = await req.json();
  const { full_name, organization, org_type, industry, team_size } = body;

  if (!full_name || typeof full_name !== "string" || full_name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const profileData = {
    full_name: full_name.trim(),
    organization_name: organization?.trim() || null,
    organization_type: org_type || null,
    industry: industry?.trim() || null,
    team_size: team_size || null,
    updated_at: new Date().toISOString(),
  };

  // Check if profile exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", userId);

    if (error) {
      logError(error, { endpoint: '/api/profile', method: 'PUT', operation: 'update' });
      return NextResponse.json({ error: `Failed to save: ${error.message}` }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: session.user.email,
        role: "user",
        subscription_tier: "free",
        ...profileData,
      });

    if (error) {
      logError(error, { endpoint: '/api/profile', method: 'PUT', operation: 'insert' });
      return NextResponse.json({ error: `Failed to save: ${error.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
