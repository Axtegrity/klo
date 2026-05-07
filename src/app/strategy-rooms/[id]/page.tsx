import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import type { StrategySessionRow } from "@/lib/supabase";
import StrategyRoomDetailClient from "./StrategyRoomDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchSession(slug: string): Promise<StrategySessionRow | null> {
  try {
    const supabase = getServiceSupabase();

    const { data: session, error } = await supabase
      .from("strategy_sessions")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error || !session) return null;

    // Compute registered_count
    const { count: registeredCount } = await supabase
      .from("strategy_registrations")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("status", "registered");

    // Check if logged-in user is registered
    let isRegistered = false;
    try {
      const userSession = await getServerSession(authOptions);
      if (userSession?.user) {
        const userId = (userSession.user as { id?: string }).id;
        if (userId) {
          const { data: reg } = await supabase
            .from("strategy_registrations")
            .select("id")
            .eq("session_id", session.id)
            .eq("user_id", userId)
            .maybeSingle();
          isRegistered = !!reg;
        }
      }
    } catch {
      // Not logged in
    }

    return {
      ...(session as unknown as StrategySessionRow),
      registered_count: registeredCount ?? 0,
      is_registered: isRegistered,
    };
  } catch {
    return null;
  }
}

async function fetchRelatedSessions(
  current: StrategySessionRow
): Promise<StrategySessionRow[]> {
  try {
    const supabase = getServiceSupabase();

    const { data: allSessions } = await supabase
      .from("strategy_sessions")
      .select("id, slug, title, date, tier, topics, is_past, total_seats, discussion_count, description, time, facilitator, attendees_override, session_date, key_takeaways, agenda, replay_url, notes_url, published, created_at, updated_at")
      .eq("published", true)
      .neq("id", current.id);

    if (!allSessions) return [];

    // Score by shared topics
    const scored = (allSessions as unknown as StrategySessionRow[]).map((s) => {
      const shared = s.topics.filter((t) => current.topics.includes(t)).length;
      return { session: s, score: shared };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((x) => x.session);
  } catch {
    return [];
  }
}

export default async function StrategyRoomDetailPage({ params }: Props) {
  const { id: slug } = await params;
  const session = await fetchSession(slug);

  if (!session) {
    notFound();
  }

  const related = await fetchRelatedSessions(session);

  return <StrategyRoomDetailClient session={session} related={related} />;
}
