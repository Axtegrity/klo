import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { getServiceSupabase } from "@/lib/supabase";
import type { StrategySessionRow } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StrategyRoomsClient from "./StrategyRoomsClient";

// Force dynamic so registration state is always fresh
export const dynamic = "force-dynamic";

async function fetchSessions(): Promise<StrategySessionRow[]> {
  try {
    const supabase = getServiceSupabase();

    const { data: sessions, error } = await supabase
      .from("strategy_sessions")
      .select("*")
      .eq("published", true)
      .order("session_date", { ascending: true, nullsFirst: false });

    if (error || !sessions) return [];

    // Compute registered_count
    const sessionIds = sessions.map((s) => s.id);
    const { data: regRows } = await supabase
      .from("strategy_registrations")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "registered");

    const countMap: Record<string, number> = {};
    for (const row of regRows ?? []) {
      countMap[row.session_id] = (countMap[row.session_id] ?? 0) + 1;
    }

    // Check if logged-in user is registered for any session
    let userRegisteredSet = new Set<string>();
    try {
      const userSession = await getServerSession(authOptions);
      if (userSession?.user) {
        const userId = (userSession.user as { id?: string }).id;
        if (userId) {
          const { data: userRegs } = await supabase
            .from("strategy_registrations")
            .select("session_id")
            .eq("user_id", userId);
          for (const r of userRegs ?? []) {
            userRegisteredSet.add(r.session_id);
          }
        }
      }
    } catch {
      // Not logged in
    }

    return sessions.map((s) => ({
      ...(s as unknown as StrategySessionRow),
      registered_count: countMap[s.id] ?? 0,
      is_registered: userRegisteredSet.has(s.id),
    }));
  } catch {
    return [];
  }
}

export default async function StrategyRoomsPage() {
  const sessions = await fetchSessions();
  const upcoming = sessions.filter((s) => !s.is_past);
  const past = sessions.filter((s) => s.is_past);

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#2764FF]/10 flex items-center justify-center">
              <Users size={24} className="text-[#2764FF]" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Strategy Rooms
              </h1>
              <p className="text-sm text-klo-muted mt-0.5">
                Collaborative sessions with Keith and fellow leaders
              </p>
            </div>
          </div>
        </div>

        {/* Client: tab toggle + session grids */}
        <StrategyRoomsClient upcoming={upcoming} past={past} />
      </div>
    </div>
  );
}
