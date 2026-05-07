import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { surveyCreateSchema } from "@/lib/validation";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

// List all surveys with response counts
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data: surveys, error } = await supabase
    .from("surveys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get response counts per survey
  const counts: Record<string, number> = {};
  if (surveys && surveys.length > 0) {
    const { data: respondents } = await supabase
      .from("survey_respondents")
      .select("survey_id")
      .not("completed_at", "is", null);

    for (const r of respondents ?? []) {
      counts[r.survey_id] = (counts[r.survey_id] || 0) + 1;
    }
  }

  const enriched = (surveys ?? []).map((s) => ({
    ...s,
    response_count: counts[s.id] || 0,
  }));

  return NextResponse.json(enriched);
}

// Create a new survey
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = surveyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("surveys")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      intro_text: parsed.data.intro_text ?? null,
      is_active: parsed.data.is_active ?? false,
      show_on_homepage: parsed.data.show_on_homepage ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/admin/surveys]", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "A survey with that slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
