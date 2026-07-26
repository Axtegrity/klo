import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { vaultPendingToolListQuerySchema } from "@/lib/validation";

// GET /api/admin/content-automation/tool-updates — list pending AI Tool of
// the Week suggestions, optionally filtered via ?status=. Same list pattern
// as src/app/api/admin/content-automation/drafts/route.ts.
export async function GET(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = vaultPendingToolListQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  let query = supabase
    .from("vault_pending_tool_updates")
    .select("*")
    .order("generated_at", { ascending: false });

  if (parsed.data.status) {
    query = query.eq("status", parsed.data.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/admin/content-automation/tool-updates]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
