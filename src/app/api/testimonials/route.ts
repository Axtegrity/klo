// Public endpoint — approved testimonials only.
// No auth required; RLS on marketing_testimonials restricts the anon key to
// reading approved=true rows. We use the service role here for reliability but
// the query itself filters to approved=true explicitly so the contract is clear
// regardless of RLS policy changes.
//
// Called by TestimonialsSection (client component) in HomeEditor.

import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("marketing_testimonials")
      .select("id, quote, organizer_name, rating, created_at")
      .eq("approved", true)
      .not("quote", "is", null)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("[GET /api/testimonials]", error);
      return NextResponse.json({ testimonials: [] }, { status: 500 });
    }

    const testimonials = (data ?? []).filter(
      (t) => typeof t.quote === "string" && t.quote.trim().length > 0
    );

    return NextResponse.json({ testimonials });
  } catch (err) {
    console.error("[GET /api/testimonials]", err);
    return NextResponse.json({ testimonials: [] }, { status: 500 });
  }
}
