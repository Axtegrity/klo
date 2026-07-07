import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "ppt", "pptx"];

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

// Mints a signed Supabase Storage upload URL so the browser can upload the
// file directly to storage, bypassing Vercel's ~4.5MB serverless body limit.
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
  const fileName = body?.fileName as string | undefined;
  const fileSize = body?.fileSize as number | undefined;

  if (!fileName || typeof fileSize !== "number") {
    return NextResponse.json({ error: "fileName and fileSize required" }, { status: 400 });
  }

  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 50MB." },
      { status: 413 }
    );
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_TYPES.includes(ext)) {
    return NextResponse.json(
      { error: `File type .${ext} not allowed. Allowed: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const path = `${eventId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from("event-files")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({ path, token: data.token });
}
