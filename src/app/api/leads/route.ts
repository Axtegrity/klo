import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { leadsCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = leadsCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, organization, source, source_id, metadata } =
    parsed.data;

  const supabase = getServiceSupabase();

  // Soft dedup: same email + source_id → return 200 (not an error)
  const { data: existing } = await supabase
    .from("klo_leads")
    .select("id")
    .eq("email", email.toLowerCase())
    .eq("source_id", source_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, id: existing.id, duplicate: true });
  }

  // Resolve user_id if signed in
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user
    ? (session.user as { id?: string }).id ?? null
    : null;

  const { data, error } = await supabase
    .from("klo_leads")
    .insert({
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      organization: organization || null,
      source,
      source_id,
      user_id: userId,
      metadata: metadata ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[POST /api/leads]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
