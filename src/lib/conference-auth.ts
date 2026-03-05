import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export type ConferenceRole = "admin" | "moderator" | "presenter" | "attendee";

export async function verifyConferenceRole(
  requiredRoles: ConferenceRole[],
  sessionId?: string
): Promise<{ userId: string; role: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id?: string }).id;
  const appRole = (session.user as { role?: string }).role;
  if (!userId) return null;

  // App-level admin/owner always passes
  if (appRole === "admin" || appRole === "owner") return { userId, role: "admin" };

  // Check conference-specific role
  const supabase = getServiceSupabase();
  const query = supabase
    .from("conference_user_roles")
    .select("role")
    .eq("user_id", userId);

  if (sessionId) {
    query.eq("session_id", sessionId);
  }

  const { data } = await query.maybeSingle();
  if (data && requiredRoles.includes(data.role as ConferenceRole)) {
    return { userId, role: data.role };
  }
  return null;
}
