import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/mp4"];
const ALL_ALLOWED = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getAssetType(mimeType: string): "image" | "video" | "audio" | "graphic" {
  if (mimeType === "image/svg+xml") return "graphic";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "image";
}

// POST /api/admin/creative-studio/media/upload — direct file upload
export async function POST(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "uncategorized";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 50MB." }, { status: 413 });
  }

  if (!ALL_ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: `File type ${file.type} not allowed.` },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const email = session.user?.email ?? "unknown";
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${folder}/${timestamp}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("creative-media")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[POST /api/admin/creative-studio/media/upload]", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("creative-media")
    .getPublicUrl(storagePath);

  const assetType = getAssetType(file.type);

  // Create the media_assets record
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      name: file.name.replace(/\.[^/.]+$/, ""),
      original_name: file.name,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
      folder,
      asset_type: assetType,
      uploaded_by: email,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/admin/creative-studio/media/upload]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "CREATE",
    entity_type: "media_asset",
    entity_id: data.id,
    details: `Uploaded: ${file.name} (${assetType})`,
    metadata: { folder, size_bytes: file.size, mime_type: file.type },
  });

  return NextResponse.json({ data }, { status: 201 });
}
