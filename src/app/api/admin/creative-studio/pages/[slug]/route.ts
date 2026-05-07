import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { pageConfigUpdateSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("page_configs")
    .select("*")
    .eq("page_slug", slug)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json();
  const parsed = pageConfigUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const email = session.user?.email ?? "unknown";

  // Read current row so we can deep-merge JSONB columns rather than replacing
  // them wholesale. Without this, saving hero text wipes the background image
  // config (and vice-versa) because two admin panels share the same column.
  const { data: current } = await supabase
    .from("page_configs")
    .select("*")
    .eq("page_slug", slug)
    .maybeSingle();

  const mergedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    const existing = (current as Record<string, unknown> | null)?.[key];
    if (
      value !== null &&
      value !== undefined &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing !== null &&
      existing !== undefined &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      mergedData[key] = { ...(existing as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      mergedData[key] = value;
    }
  }

  const { data, error } = await supabase
    .from("page_configs")
    .update({ ...mergedData, updated_by: email })
    .eq("page_slug", slug)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/admin/creative-studio/pages/[slug]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "UPDATE",
    entity_type: "page_config",
    entity_id: data.id,
    details: `Updated page config: ${data.page_label}`,
    metadata: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ data });
}
