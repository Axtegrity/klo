// Admin testimonial management — GET (list all) + POST (manual create).
// Approval, edits, and deletes live in the [id] route.
//
// Auth: verifyCreativeStudioAdmin — owner/admin only (dev mode bypass).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";

const CreateTestimonialSchema = z.object({
  email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  quote: z.string().max(2000).nullable().optional(),
  organizer_name: z.string().max(200).nullable().optional(),
  event_id: z.string().uuid().nullable().optional(),
  approved: z.boolean().optional(),
});

export async function GET() {
  const session = await verifyCreativeStudioAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("marketing_testimonials")
      .select("id, event_id, email, rating, quote, organizer_name, approved, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/marketing/testimonials]", error);
      return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
    }

    return NextResponse.json({ testimonials: data ?? [] });
  } catch (err) {
    console.error("[GET /api/admin/marketing/testimonials]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateTestimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("marketing_testimonials")
      .insert({
        email: parsed.data.email,
        rating: parsed.data.rating,
        quote: parsed.data.quote ?? null,
        organizer_name: parsed.data.organizer_name ?? null,
        event_id: parsed.data.event_id ?? null,
        approved: parsed.data.approved ?? false,
      })
      .select("id, event_id, email, rating, quote, organizer_name, approved, created_at")
      .single();

    if (error) {
      console.error("[POST /api/admin/marketing/testimonials]", error);
      return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
    }

    return NextResponse.json({ testimonial: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/marketing/testimonials]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
