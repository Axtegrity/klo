import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { z } from "zod";

// ------------------------------------------------------------
// Zod schema
// ------------------------------------------------------------

const patchSchema = z.object({
  // New messages to append — NOT the full history
  messages: z.array(z.any()).min(1),
});

// ------------------------------------------------------------
// GET /api/advisor/conversations/[id]
// Returns a single conversation including full messages jsonb.
// Ownership is verified belt-and-suspenders on top of RLS.
// ------------------------------------------------------------

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("advisor_conversations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    if (data.user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    return NextResponse.json({ conversation: data });
  } catch (err) {
    console.error("[GET /api/advisor/conversations/[id]]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// PATCH /api/advisor/conversations/[id]
// Appends new messages to an existing conversation row.
// ------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { messages: newMessages } = parsed.data;

    const supabase = getServiceSupabase();

    // Fetch existing row to verify ownership and get current messages
    const { data: existing, error: fetchError } = await supabase
      .from("advisor_conversations")
      .select("id, user_id, messages, message_count")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      console.error("[PATCH /api/advisor/conversations/[id]] fetch error", fetchError);
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    // Belt-and-suspenders ownership check on top of RLS
    if (existing.user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    const existingMessages = Array.isArray(existing.messages)
      ? (existing.messages as unknown[])
      : [];
    const updatedMessages = [...existingMessages, ...newMessages];

    const { error: updateError } = await supabase
      .from("advisor_conversations")
      .update({
        messages: updatedMessages,
        message_count: updatedMessages.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[PATCH /api/advisor/conversations/[id]]", updateError);
      return NextResponse.json(
        { error: "Failed to update conversation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/advisor/conversations/[id]]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
