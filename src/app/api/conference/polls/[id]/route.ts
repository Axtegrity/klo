import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { pollUpdateSchema } from "@/lib/validation";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = pollUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const supabase = getServiceSupabase();

  const updates: Record<string, unknown> = {};
  if (typeof parsed.data.is_active === "boolean") updates.is_active = parsed.data.is_active;
  if (typeof parsed.data.show_results === "boolean") updates.show_results = parsed.data.show_results;
  if (parsed.data.is_active === false) updates.closed_at = new Date().toISOString();
  // Undeploy: send poll back to queue — force-close it too
  if (parsed.data.is_deployed === false) {
    updates.is_deployed = false;
    updates.is_active = false;
    updates.show_results = false;
    updates.closed_at = null;
  }

  const { data, error } = await supabase
    .from("conference_polls")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  // Delete votes first, then the poll
  await supabase.from("conference_poll_votes").delete().eq("poll_id", id);

  const { error } = await supabase
    .from("conference_polls")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
