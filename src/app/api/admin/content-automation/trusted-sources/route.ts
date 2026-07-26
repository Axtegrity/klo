import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { vaultTrustedSourceSchema, vaultTrustedSourceToggleSchema } from "@/lib/validation";

// GET /api/admin/content-automation/trusted-sources — list all trusted
// sources, optionally filtered to active-only via ?active=true. Same
// string-comparison query-param pattern used elsewhere in this repo (see
// src/app/api/conference/sessions/route.ts's active_only param) rather than
// a Zod-parsed boolean.
export async function GET(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activeOnly = req.nextUrl.searchParams.get("active") === "true";

  const supabase = getServiceSupabase();
  let query = supabase
    .from("vault_trusted_sources")
    .select("*")
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/admin/content-automation/trusted-sources]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/admin/content-automation/trusted-sources — add a new trusted source
export async function POST(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = vaultTrustedSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("vault_trusted_sources")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error("[POST /api/admin/content-automation/trusted-sources]", error);
    // Same 23505 -> 409 pattern as lanes/route.ts and src/app/api/admin/surveys/route.ts
    // rather than surfacing the raw Postgres error message to the client.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A trusted source with this domain already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const email = session.user?.email ?? "unknown";
  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "CREATE",
    entity_type: "vault_trusted_source",
    entity_id: data.id,
    details: `Added content automation trusted source: ${data.name} (${data.domain})`,
  });

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/admin/content-automation/trusted-sources — toggle a source's
// active flag. Source identified by `id` in the body, same convention as
// lanes/route.ts's PATCH.
export async function PATCH(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = vaultTrustedSourceToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("vault_trusted_sources")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/admin/content-automation/trusted-sources]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const email = session.user?.email ?? "unknown";
  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "UPDATE",
    entity_type: "vault_trusted_source",
    entity_id: data.id,
    details: `Set active=${parsed.data.active} on trusted source: ${data.name}`,
  });

  return NextResponse.json({ data });
}
