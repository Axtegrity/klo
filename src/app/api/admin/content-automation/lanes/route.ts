import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { vaultTopicLaneSchema, vaultTopicLaneToggleSchema } from "@/lib/validation";

// GET /api/admin/content-automation/lanes — list all topic lanes
export async function GET() {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("vault_topic_lanes")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[GET /api/admin/content-automation/lanes]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/admin/content-automation/lanes — create a new topic lane
export async function POST(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = vaultTopicLaneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("vault_topic_lanes")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error("[POST /api/admin/content-automation/lanes]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const email = session.user?.email ?? "unknown";
  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "CREATE",
    entity_type: "vault_topic_lane",
    entity_id: data.id,
    details: `Created content automation topic lane: ${data.name}`,
  });

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/admin/content-automation/lanes — toggle a lane's active flag.
// Lane identified by `id` in the body (consistent with how the review
// endpoint in drafts/[id] takes its target from the route, and how other
// admin PATCH routes in this repo take their target field set from a
// validated body rather than a query param).
export async function PATCH(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = vaultTopicLaneToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("vault_topic_lanes")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/admin/content-automation/lanes]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const email = session.user?.email ?? "unknown";
  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "UPDATE",
    entity_type: "vault_topic_lane",
    entity_id: data.id,
    details: `Set active=${parsed.data.active} on topic lane: ${data.name}`,
  });

  return NextResponse.json({ data });
}
