import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { animationPresetUpdateSchema } from "@/lib/validation";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getServiceSupabase();

  // Check if system preset
  const { data: existing } = await supabase
    .from("animation_presets")
    .select("is_system")
    .eq("id", id)
    .single();

  if (existing?.is_system) {
    return NextResponse.json({ error: "Cannot modify system presets" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = animationPresetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("animation_presets")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/admin/creative-studio/animation-presets/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getServiceSupabase();

  const { data: existing } = await supabase
    .from("animation_presets")
    .select("is_system, name")
    .eq("id", id)
    .single();

  if (existing?.is_system) {
    return NextResponse.json({ error: "Cannot delete system presets" }, { status: 403 });
  }

  const { error } = await supabase.from("animation_presets").delete().eq("id", id);
  if (error) {
    console.error("[DELETE /api/admin/creative-studio/animation-presets/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const email = session.user?.email ?? "unknown";
  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "DELETE",
    entity_type: "animation_preset",
    entity_id: id,
    details: `Deleted animation preset: ${existing?.name ?? id}`,
  });

  return NextResponse.json({ success: true });
}
