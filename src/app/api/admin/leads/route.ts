import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { logError, logRequest } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function GET(request: NextRequest) {
  logRequest(request);
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") ?? "all";
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = (page - 1) * limit;

  const supabase = getServiceSupabase();

  // Summary counts — run in parallel
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [totalRes, assessmentRes, surveyRes, recentRes] = await Promise.all([
    supabase.from("klo_leads").select("*", { count: "exact", head: true }),
    supabase.from("klo_leads").select("*", { count: "exact", head: true }).eq("source", "assessment"),
    supabase.from("klo_leads").select("*", { count: "exact", head: true }).eq("source", "survey"),
    supabase.from("klo_leads").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
  ]);

  // Filtered + paginated leads query
  let query = supabase
    .from("klo_leads")
    .select("id, created_at, name, email, phone, organization, source, source_id", { count: "exact" });

  if (source !== "all") {
    query = query.eq("source", source);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logError(error, { endpoint: "/api/admin/leads", method: "GET" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    leads: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
    summary: {
      total: totalRes.count ?? 0,
      assessments: assessmentRes.count ?? 0,
      surveys: surveyRes.count ?? 0,
      last7Days: recentRes.count ?? 0,
    },
  });
}
