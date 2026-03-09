import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();

    // Delete assessment results
    await supabase.from("assessment_results").delete().eq("user_id", userId);

    // Delete profile
    await supabase.from("profiles").delete().eq("id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[delete-account] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
