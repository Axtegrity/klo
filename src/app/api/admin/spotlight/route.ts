import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  mode: z.enum(["auto", "manual"]),
  manual_event_id: z.string().uuid().nullable().optional(),
  show_countdown: z.boolean().optional(),
  card_position: z.enum(["above", "below"]).optional(),
  show_live_section: z.boolean().optional(),
  show_upcoming_section: z.boolean().optional(),
  show_past_section: z.boolean().optional(),
  card_show_host: z.boolean().optional(),
  card_show_event_name: z.boolean().optional(),
  card_show_session_subtitle: z.boolean().optional(),
  card_show_meta: z.boolean().optional(),
  card_show_sessions_list: z.boolean().optional(),
});

export async function GET() {
  const session = await verifyAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("site_spotlight")
    .select("mode, manual_event_id, show_countdown, card_position, show_live_section, show_upcoming_section, show_past_section, card_show_host, card_show_event_name, card_show_session_subtitle, card_show_meta, card_show_sessions_list, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? {
    mode: "auto",
    manual_event_id: null,
    show_countdown: true,
    card_position: "below",
    show_live_section: true,
    show_upcoming_section: true,
    show_past_section: true,
    card_show_host: true,
    card_show_event_name: true,
    card_show_session_subtitle: true,
    card_show_meta: true,
    card_show_sessions_list: true,
  });
}

export async function PUT(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const updates: Record<string, unknown> = {
    mode: parsed.data.mode,
    manual_event_id: parsed.data.mode === "manual" ? parsed.data.manual_event_id ?? null : null,
    updated_at: new Date().toISOString(),
  };
  if (typeof parsed.data.show_countdown === "boolean") updates.show_countdown = parsed.data.show_countdown;
  if (parsed.data.card_position) updates.card_position = parsed.data.card_position;
  if (typeof parsed.data.show_live_section === "boolean") updates.show_live_section = parsed.data.show_live_section;
  if (typeof parsed.data.show_upcoming_section === "boolean") updates.show_upcoming_section = parsed.data.show_upcoming_section;
  if (typeof parsed.data.show_past_section === "boolean") updates.show_past_section = parsed.data.show_past_section;
  if (typeof parsed.data.card_show_host === "boolean") updates.card_show_host = parsed.data.card_show_host;
  if (typeof parsed.data.card_show_event_name === "boolean") updates.card_show_event_name = parsed.data.card_show_event_name;
  if (typeof parsed.data.card_show_session_subtitle === "boolean") updates.card_show_session_subtitle = parsed.data.card_show_session_subtitle;
  if (typeof parsed.data.card_show_meta === "boolean") updates.card_show_meta = parsed.data.card_show_meta;
  if (typeof parsed.data.card_show_sessions_list === "boolean") updates.card_show_sessions_list = parsed.data.card_show_sessions_list;

  const { data, error } = await supabase
    .from("site_spotlight")
    .update(updates)
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
