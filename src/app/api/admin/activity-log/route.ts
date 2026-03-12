import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function GET() {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("admin_activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, entity_type, entity_id, details, metadata } = body;

  if (!action || !entity_type) {
    return NextResponse.json({ error: "action and entity_type required" }, { status: 400 });
  }

  const user = session.user as { id?: string; email?: string };

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("admin_activity_log")
    .insert({
      admin_user_id: user.id || null,
      admin_email: user.email || null,
      action,
      entity_type,
      entity_id: entity_id || null,
      details: details || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
