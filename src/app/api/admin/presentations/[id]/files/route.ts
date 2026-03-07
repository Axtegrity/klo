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

  const { id: presentationId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 50MB." },
      { status: 413 }
    );
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
  const filePath = `${presentationId}/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("presentation-files")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("presentation-files")
    .getPublicUrl(filePath);

  const sizeKB = Math.round(file.size / 1024);
  const fileSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

  const { data, error } = await supabase
    .from("conference_presentation_files")
    .insert({
      presentation_id: presentationId,
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

  await params;
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data: fileRecord } = await supabase
    .from("conference_presentation_files")
    .select("file_url")
    .eq("id", fileId)
    .single();

  if (fileRecord?.file_url) {
    const urlParts = fileRecord.file_url.split("/presentation-files/");
    if (urlParts[1]) {
      await supabase.storage.from("presentation-files").remove([urlParts[1]]);
    }
  }

  const { error } = await supabase
    .from("conference_presentation_files")
    .delete()
    .eq("id", fileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
