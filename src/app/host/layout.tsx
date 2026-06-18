import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase";

export const metadata = { title: "Host Dashboard — KLO" };

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // App-level admins/owners/moderators always have access
  if (["owner", "admin", "moderator"].includes(role ?? "")) {
    return <>{children}</>;
  }

  // Check if this user has a host conference role on any live event
  if (userId) {
    const supabase = getServiceSupabase();
    const { data: hostRole } = await supabase
      .from("conference_user_roles")
      .select("event_id")
      .eq("user_id", userId)
      .eq("role", "host")
      .not("event_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (hostRole?.event_id) {
      const { data: liveEvent } = await supabase
        .from("event_presentations")
        .select("id")
        .eq("id", hostRole.event_id)
        .eq("seminar_mode", true)
        .maybeSingle();

      if (liveEvent) {
        return <>{children}</>;
      }
    }
  }

  redirect("/");
}
