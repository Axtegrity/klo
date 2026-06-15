import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { z } from "zod";

// ------------------------------------------------------------
// Zod schema
// ------------------------------------------------------------

const postSchema = z.object({
  title: z.string().max(60),
  messages: z.array(z.any()).min(1),
});

// ------------------------------------------------------------
// GET /api/advisor/conversations
// Lists the current user's conversations (no messages jsonb).
// ------------------------------------------------------------

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("advisor_conversations")
      .select("id, title, message_count, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[GET /api/advisor/conversations]", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations." },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversations: data ?? [] });
  } catch (err) {
    console.error("[GET /api/advisor/conversations]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// POST /api/advisor/conversations
// Creates a new conversation row with the first message pair.
// ------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, messages } = parsed.data;

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("advisor_conversations")
      .insert({
        user_id: userId,
        title,
        messages,
        message_count: messages.length,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[POST /api/advisor/conversations]", error);
      return NextResponse.json(
        { error: "Failed to create conversation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/advisor/conversations]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
