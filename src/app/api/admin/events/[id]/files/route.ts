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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  const supabase = getServiceSupabase();

  let query = supabase
    .from("event_files")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
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
  const body = await req.json().catch(() => null);
  const filePath = body?.filePath as string | undefined;
  const fileName = body?.fileName as string | undefined;
  const fileSizeBytes = body?.fileSizeBytes as number | undefined;
  const sessionId = (body?.sessionId as string | null | undefined) ?? null;

  if (!filePath || !fileName || typeof fileSizeBytes !== "number") {
    return NextResponse.json({ error: "filePath, fileName, and fileSizeBytes required" }, { status: 400 });
  }

  if (!filePath.startsWith(`${eventId}/`)) {
    return NextResponse.json({ error: "filePath does not match event" }, { status: 400 });
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const allowedTypes = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "ppt", "pptx"];
  if (!allowedTypes.includes(ext)) {
    return NextResponse.json(
      { error: `File type .${ext} not allowed. Allowed: ${allowedTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // Confirm the file actually landed in storage before recording it
  const { data: existing } = await supabase.storage
    .from("event-files")
    .list(eventId, { search: filePath.split("/").pop() });
  if (!existing || existing.length === 0) {
    return NextResponse.json({ error: "Uploaded file not found in storage" }, { status: 400 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("event-files")
    .getPublicUrl(filePath);

  // Format file size
  const sizeKB = Math.round(fileSizeBytes / 1024);
  const fileSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

  // Insert record
  const { data, error } = await supabase
    .from("event_files")
    .insert({
      event_id: eventId,
      session_id: sessionId,
      file_name: fileName,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params;
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  const body = await req.json();
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("event_files")
    .update({ is_visible: body.is_visible })
    .eq("id", fileId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
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
