import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function GET() {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("event_presentations")
    .select(
      `
      *,
      event_files (*)
    `
    )
    .order("event_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    conference_name,
    conference_location,
    event_category,
    description,
    event_date,
    event_time,
    event_timezone,
    website_url,
    start_date,
    end_date,
  } = body;

  if (!title || !conference_name || !conference_location || !event_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("event_presentations")
    .insert({
      title,
      slug,
      conference_name,
      conference_location,
      event_category: event_category || "Current Events",
      description: description || null,
      event_date,
      event_time: event_time || null,
      event_timezone: event_timezone || "America/Chicago",
      website_url: website_url || null,
      start_date: start_date || null,
      end_date: end_date || null,
      is_published: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
