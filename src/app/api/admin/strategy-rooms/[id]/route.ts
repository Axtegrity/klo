import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { strategySessionUpdateSchema } from "@/lib/validation";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

// PUT /api/admin/strategy-rooms/[id]
// [id] is the session UUID (not slug). Updates session.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = strategySessionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const supabase = getServiceSupabase();

    const updateData = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("strategy_sessions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PUT /api/admin/strategy-rooms/[id]]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[PUT /api/admin/strategy-rooms/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/strategy-rooms/[id]
// Deletes a session. Blocks if active registrations exist.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = getServiceSupabase();

    // Check for active registrations
    const { count: activeCount, error: countError } = await supabase
      .from("strategy_registrations")
      .select("*", { count: "exact", head: true })
      .eq("session_id", id)
      .eq("status", "registered");

    if (countError) {
      console.error("[DELETE /api/admin/strategy-rooms/[id]] count", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((activeCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a session with active registrations. Cancel all registrations first.",
        },
        { status: 409 }
      );
    }

    const { error: deleteError } = await supabase
      .from("strategy_sessions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[DELETE /api/admin/strategy-rooms/[id]]", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/strategy-rooms/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
