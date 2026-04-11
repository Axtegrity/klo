// Server-side helpers for the marketing surface (testimonials, social, etc.).
// These pair with admin write endpoints under /api/admin/marketing/* and
// public collection endpoints (e.g., email-link rating capture).

import { getServiceSupabase } from "@/lib/supabase";

export interface PublicTestimonial {
  id: string;
  quote: string;
  organizer_name: string | null;
  rating: number;
  created_at: string;
}

/**
 * Fetch approved testimonials with non-empty quotes for public display.
 * Returns newest first. Hides itself in the UI if the result is empty.
 */
export async function getApprovedTestimonials(
  limit = 6
): Promise<PublicTestimonial[]> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("marketing_testimonials")
      .select("id, quote, organizer_name, rating, created_at")
      .eq("approved", true)
      .not("quote", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as PublicTestimonial[]).filter(
      (t) => typeof t.quote === "string" && t.quote.trim().length > 0
    );
  } catch {
    return [];
  }
}
