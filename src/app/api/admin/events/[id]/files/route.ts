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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedTypes = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "ppt", "pptx"];
  if (!allowedTypes.includes(ext)) {
    return NextResponse.json(
      { error: `File type .${ext} not allowed. Allowed: ${allowedTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // Upload to storage
  const filePath = `${eventId}/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("event-files")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("event-files")
    .getPublicUrl(filePath);

  // Determine simplified file type
  let fileType = ext;
  if (fileType === "docx") fileType = "doc";
  if (fileType === "xlsx") fileType = "xls";

  // Format file size
  const sizeKB = Math.round(file.size / 1024);
  const fileSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

  // Insert record
  const { data, error } = await supabase
    .from("event_files")
    .insert({
      event_id: eventId,
      file_name: file.name,
      file_type: ext,
      file_url: urlData.publicUrl,
      file_size: fileSize,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params; // consume params
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Get file record to find storage path
  const { data: fileRecord } = await supabase
    .from("event_files")
    .select("file_url")
    .eq("id", fileId)
    .single();

  if (fileRecord?.file_url) {
    // Extract path from URL
    const urlParts = fileRecord.file_url.split("/event-files/");
    if (urlParts[1]) {
      await supabase.storage.from("event-files").remove([urlParts[1]]);
    }
  }

  const { error } = await supabase
    .from("event_files")
    .delete()
    .eq("id", fileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
