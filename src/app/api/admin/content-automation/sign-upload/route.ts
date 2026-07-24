import { NextRequest, NextResponse } from "next/server";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { contentAutomationSignUploadSchema } from "@/lib/validation";
import { getServiceSupabase } from "@/lib/supabase";

// POST /api/admin/content-automation/sign-upload — mints a signed Supabase
// Storage upload URL against the existing `documents` bucket (migration
// 20260506000003_create_documents_storage_bucket.sql, 10MB limit) so the
// browser uploads a reference PDF/DOCX directly to storage, bypassing
// Vercel's ~4.5MB serverless body cap. Mirrors
// src/app/api/admin/events/[id]/files/sign-upload/route.ts's pattern (see
// that file + this repo's CLAUDE.md "File uploads must never send the file
// body through a Next.js API route" section, PR #203).
//
// The `documents` bucket's own allowed_mime_types is broader (also allows
// doc, txt, ppt, pptx) than this feature needs — contentAutomationSignUploadSchema
// enforces the narrower .pdf/.docx-only constraint on top of, not instead
// of, the bucket's own allowlist.
export async function POST(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = contentAutomationSignUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fileName } = parsed.data;
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `content-automation-refs/${Date.now()}-${sanitized}`;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.storage.from("documents").createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[POST /api/admin/content-automation/sign-upload]", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create upload URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ path, token: data.token });
}
