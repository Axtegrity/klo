import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { inquiryUpdateSchema } from "@/lib/validation";
import { logError, logRequest } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function GET(req: NextRequest) {
  logRequest(req);
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const url = req.nextUrl;
  const type = url.searchParams.get("type") || "all";
  const status = url.searchParams.get("status") || "all";
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("inquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type !== "all") {
    query = query.eq("type", type);
  }
  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    logError(error, { endpoint: '/api/admin/inquiries', method: 'GET' });
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }

  // Fetch count of "new" inquiries for badge
  const { count: newCount } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  return NextResponse.json({
    inquiries: data ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
    newCount: newCount ?? 0,
  });
}

export async function PATCH(req: NextRequest) {
  logRequest(req);
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const body = await req.json();
  const parsed = inquiryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  const { id, status } = parsed.data;

  const { error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", id);

  if (error) {
    logError(error, { endpoint: '/api/admin/inquiries', method: 'PATCH' });
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
