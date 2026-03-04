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
    .from("app_settings")
    .select("value")
    .eq("key", "seminar_mode")
    .single();

  if (error) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json(data.value);
}

export async function PUT(request: Request) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from("app_settings")
    .update({ value: { active: !!body.active }, updated_at: new Date().toISOString() })
    .eq("key", "seminar_mode");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ active: !!body.active });
}
