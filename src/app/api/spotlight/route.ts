import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Returns the currently spotlighted event + its sessions, or null.
// In 'manual' mode we trust the admin's selection. In 'auto' we pick the
// nearest upcoming published event that is visible on the events page.
export async function GET() {
  const supabase = getServiceSupabase();

  const { data: cfg, error: cfgErr } = await supabase
    .from("site_spotlight")
    .select("mode, manual_event_id, show_countdown, card_position, show_live_section, show_upcoming_section, show_past_section, card_show_host, card_show_event_name, card_show_session_subtitle, card_show_meta, card_show_sessions_list")
    .eq("id", 1)
    .maybeSingle();
  if (cfgErr) return NextResponse.json({ error: cfgErr.message }, { status: 500 });

  // Always-on flags — returned even when no event is spotlighted.
  const sections = {
    show_live_section: cfg?.show_live_section ?? true,
    show_upcoming_section: cfg?.show_upcoming_section ?? true,
    show_past_section: cfg?.show_past_section ?? true,
    card_show_host: cfg?.card_show_host ?? true,
    card_show_event_name: cfg?.card_show_event_name ?? true,
    card_show_session_subtitle: cfg?.card_show_session_subtitle ?? true,
    card_show_meta: cfg?.card_show_meta ?? true,
    card_show_sessions_list: cfg?.card_show_sessions_list ?? true,
  };

  let eventId: string | null = null;

  if (cfg?.mode === "manual") {
    // Respect the admin's "manual" choice strictly — if no event is picked,
    // return no spotlight rather than silently falling back to auto.
    eventId = cfg.manual_event_id ?? null;
  } else {
    // Auto: pick the nearest upcoming published + visible event.
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const { data: candidates } = await supabase
      .from("event_presentations")
      .select("id, event_date, event_time")
      .eq("is_published", true)
      .eq("display_on_events_page", true)
      .gte("event_date", todayStr)
      .neq("event_date", "SAVE THE DATE")
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true, nullsFirst: true })
      .limit(10);

    if (candidates && candidates.length > 0) {
      const pick = candidates.find((c) => {
        const t = c.event_time || "23:59";
        return new Date(`${c.event_date}T${t}:00`) >= now;
      });
      eventId = pick?.id ?? null;
    }
  }

  if (!eventId) {
    return NextResponse.json({ event: null, sessions: [], show_countdown: false, card_position: "below" as const, ...sections });
  }

  const { data: event, error: evErr } = await supabase
    .from("event_presentations")
    .select("*, event_files(*)")
    .eq("id", eventId)
    .maybeSingle();
  if (evErr || !event) {
    return NextResponse.json({ event: null, sessions: [], show_countdown: false, card_position: "below" as const, ...sections });
  }

  const { data: sessions } = await supabase
    .from("event_sessions")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  return NextResponse.json({
    event,
    sessions: sessions ?? [],
    show_countdown: cfg?.show_countdown ?? true,
    card_position: (cfg?.card_position === "above" ? "above" : "below") as "above" | "below",
    ...sections,
  });
}
