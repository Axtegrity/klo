// Admin testimonial detail — PATCH (approve / edit quote / organizer) + DELETE.
// Auth: verifyCreativeStudioAdmin — owner/admin only.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";

const UpdateTestimonialSchema = z.object({
  approved: z.boolean().optional(),
  quote: z.string().max(2000).nullable().optional(),
  organizer_name: z.string().max(200).nullable().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

const UuidSchema = z.string().uuid();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateTestimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("marketing_testimonials")
      .update(parsed.data)
      .eq("id", id)
      .select("id, event_id, email, rating, quote, organizer_name, approved, created_at")
      .single();

    if (error) {
      console.error("[PATCH /api/admin/marketing/testimonials/:id]", error);
      return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ testimonial: data });
  } catch (err) {
    console.error("[PATCH /api/admin/marketing/testimonials/:id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("marketing_testimonials")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[DELETE /api/admin/marketing/testimonials/:id]", error);
      return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/marketing/testimonials/:id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
