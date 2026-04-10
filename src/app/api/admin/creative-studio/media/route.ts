import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { mediaAssetCreateSchema, mediaListQuerySchema } from "@/lib/validation";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

// GET /api/admin/creative-studio/media — list media assets
export async function GET(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = mediaListQuerySchema.safeParse({
    folder: url.searchParams.get("folder") ?? undefined,
    asset_type: url.searchParams.get("asset_type") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }

  const { folder, asset_type, search, limit = 50, offset = 0 } = parsed.data;
  const supabase = getServiceSupabase();

  let query = supabase
    .from("media_assets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (folder) query = query.eq("folder", folder);
  if (asset_type) query = query.eq("asset_type", asset_type);
  if (search) query = query.or(`name.ilike.%${search}%,tags.cs.{${search}}`);

  const { data, error, count } = await query;

  if (error) {
    console.error("[GET /api/admin/creative-studio/media]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count });
}

// POST /api/admin/creative-studio/media — create media record after upload
export async function POST(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = mediaAssetCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const email = session.user?.email ?? "unknown";

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      ...parsed.data,
      folder: parsed.data.folder ?? "uncategorized",
      tags: parsed.data.tags ?? [],
      uploaded_by: email,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/admin/creative-studio/media]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "CREATE",
    entity_type: "media_asset",
    entity_id: data.id,
    details: `Uploaded media: ${data.name}`,
    metadata: { asset_type: data.asset_type, folder: data.folder },
  });

  return NextResponse.json({ data }, { status: 201 });
}
