import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

// The owner account is protected from all admin mutations
const OWNER_ID = "00000000-0000-0000-0000-000000000001";

const ALLOWED_ROLES = ["user", "moderator", "admin"] as const;

const PatchSchema = z.object({
  role: z.enum(ALLOWED_ROLES).optional(),
  disabled: z.boolean().optional(),
}).refine((data) => data.role !== undefined || data.disabled !== undefined, {
  message: "Provide at least one of: role, disabled",
});

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (id === OWNER_ID) {
    return NextResponse.json({ error: "Cannot modify the owner account" }, { status: 403 });
  }

  const adminEmail = (session.user as { email?: string }).email;
  const adminId = (session.user as { id?: string }).id;
  if (id === adminId) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 403 });
  }

  const body = await req.json();
  const result = PatchSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const updates: Record<string, unknown> = {};

  if (result.data.role !== undefined) {
    updates.role = result.data.role;
  }

  if (result.data.disabled !== undefined) {
    updates.disabled = result.data.disabled;
    if (result.data.disabled) {
      updates.disabled_at = new Date().toISOString();
      updates.disabled_by = adminEmail ?? "unknown";
    } else {
      updates.disabled_at = null;
      updates.disabled_by = null;
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select("id, email, full_name, role, disabled, disabled_at, disabled_by, subscription_tier, organization_name, created_at, updated_at")
    .single();

  if (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (id === OWNER_ID) {
    return NextResponse.json({ error: "Cannot delete the owner account" }, { status: 403 });
  }

  const adminEmail = (session.user as { email?: string }).email;
  const adminId = (session.user as { id?: string }).id;
  if (id === adminId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 403 });
  }

  const supabase = getServiceSupabase();

  // Soft-delete: disable + anonymize — never drop the row (audit trail)
  const { error } = await supabase
    .from("profiles")
    .update({
      disabled: true,
      disabled_at: new Date().toISOString(),
      disabled_by: adminEmail ?? "unknown",
      password_hash: null,
      email: `deleted_${id}@deleted.local`,
    })
    .eq("id", id);

  if (error) {
    console.error("[DELETE /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
