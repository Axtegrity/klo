import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return null;
  return session;
}

export async function GET() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("conference_polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { question, options } = body;

  if (!question || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json(
      { error: "Question and at least 2 options required" },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("conference_polls")
    .insert({ question, options })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
