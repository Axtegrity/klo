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
    // Auto mode picks a spotlight event using a 3-tier priority:
    //   1. A multi-day event currently within its start_date..end_date range
    //      that has a live session running (seminar_mode) — live always wins.
    //   2. Any event currently within its date range, even with no live
    //      session — "happening now" beats anything merely upcoming.
    //   3. Otherwise, the nearest upcoming event (original single-query logic).
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Pool A: events whose start_date..end_date range covers today. Events
    // without start_date/end_date never match here — null comparisons are
    // never true in Postgres — and simply fall through to Pool B below.
    const { data: activeCandidates } = await supabase
      .from("event_presentations")
      .select("id, event_date, event_time, end_date, start_date, seminar_mode")
      .eq("is_published", true)
      .eq("display_on_events_page", true)
      .lte("start_date", todayStr)
      .gte("end_date", todayStr)
      .neq("event_date", "SAVE THE DATE");

    // Pool B: nearest upcoming published + visible events.
    const { data: candidates } = await supabase
      .from("event_presentations")
      .select("id, event_date, event_time, end_date, start_date, seminar_mode")
      .eq("is_published", true)
      .eq("display_on_events_page", true)
      .gte("event_date", todayStr)
      .neq("event_date", "SAVE THE DATE")
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true, nullsFirst: true })
      .limit(10);

    const activeLive = activeCandidates?.find((c) => c.seminar_mode === true);
    const activeAny = activeCandidates?.[0];

    if (activeLive) {
      eventId = activeLive.id;
    } else if (activeAny) {
      eventId = activeAny.id;
    } else if (candidates && candidates.length > 0) {
      // Fallback: pick the first upcoming event that hasn't ended yet. Using
      // end_date (or event_date for single-day events) means a multi-day
      // event stays spotlighted for its full run — not just until its start
      // time passes.
      const pick = candidates.find((c) => {
        const endStr = c.end_date || c.event_date;
        return new Date(`${endStr}T23:59:59`) >= now;
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
    .from("conference_sessions")
    .select("id, title, speaker, time_label, room, sort_order, is_active")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  return NextResponse.json({
    event,
      sessions: (sessions ?? []).map((s: { id: string; title: string; speaker?: string | null; time_label?: string | null; room?: string | null; sort_order?: number | null; is_active?: boolean }) => ({
        ...s,
        session_name: s.title,
      })),
    show_countdown: cfg?.show_countdown ?? true,
    card_position: (cfg?.card_position === "above" ? "above" : "below") as "above" | "below",
    ...sections,
  });
}
