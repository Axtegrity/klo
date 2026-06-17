import { NextResponse } from "next/server";
import { verifyConferenceRole } from "@/lib/conference-auth";
import { getServiceSupabase } from "@/lib/supabase";
import { roleAssignSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await verifyConferenceRole(["admin"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const eventId = searchParams.get("event_id");
  const supabase = getServiceSupabase();

  let query = supabase.from("conference_user_roles").select("*");
  if (sessionId) query = query.eq("session_id", sessionId);
  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await verifyConferenceRole(["admin"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = roleAssignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { user_id, email, session_id, event_id, role } = parsed.data;

  const supabase = getServiceSupabase();

  // Resolve user_id from email if email provided
  let resolvedUserId = user_id;
  if (!resolvedUserId && email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "No account found with that email address" },
        { status: 404 }
      );
    }
    resolvedUserId = profile.id;
  }

  if (!resolvedUserId) {
    return NextResponse.json(
      { error: "Either user_id or email is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("conference_user_roles")
    .upsert(
      {
        user_id: resolvedUserId,
        session_id: session_id || null,
        event_id: event_id || null,
        role,
        assigned_by: auth.userId,
      },
      { onConflict: "user_id,session_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await verifyConferenceRole(["admin"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("id");

  if (!roleId) {
    return NextResponse.json({ error: "Role id required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("conference_user_roles")
    .delete()
    .eq("id", roleId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
