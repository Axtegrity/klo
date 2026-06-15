import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase, getServiceSupabase } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

// ----------------------------------------------------------------
// Zod schema for PUT body
// ----------------------------------------------------------------

const serviceSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(600),
  badge: z.string().min(1).max(60),
});

const aboutContentUpdateSchema = z.object({
  hero_badge: z.string().max(200).optional(),
  hero_heading: z.string().max(200).optional(),
  hero_tagline: z.string().max(600).optional(),
  bio_paragraphs: z.array(z.string().max(2000)).optional(),
  services: z.array(serviceSchema).min(1).max(10).optional(),
});

// ----------------------------------------------------------------
// GET — public, no auth required
// Cache-Control handled via fetch revalidate on the page; we set
// the header here too so CDN edges can cache it.
// ----------------------------------------------------------------

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("about_content")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/about]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ data: null }, { status: 404 });
  }

  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    }
  );
}

// ----------------------------------------------------------------
// PUT — admin-gated, Zod-validated
// ----------------------------------------------------------------

export async function PUT(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = aboutContentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // Resolve the row id — we always work with the single seed row
  const { data: existing } = await supabase
    .from("about_content")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "About content record not found. Apply migration first." }, { status: 404 });
  }

  // Resolve updated_by from session user id (profiles.id)
  // verifyAdmin returns email; look up the profile id if available
  const userEmail = (session.user as { email?: string }).email ?? null;
  let updatedById: string | null = null;
  if (userEmail && userEmail !== "dev@local") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email" as never, userEmail)
      .maybeSingle();
    updatedById = profile?.id ?? null;
  }

  const { data, error } = await supabase
    .from("about_content")
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
      updated_by: updatedById,
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    console.error("[PUT /api/about]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
