"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageSquarePlus } from "lucide-react";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface ConversationListItem {
  id: string;
  title: string;
  message_count: number;
  updated_at: string;
}

interface ConversationSidebarProps {
  onSelect: (id: string) => void;
  onNewChat: () => void;
  activeConversationId: string | null;
  className?: string;
}

// ------------------------------------------------------------
// Time ago helper — no external library
// ------------------------------------------------------------

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ------------------------------------------------------------
// ConversationSidebar
// ------------------------------------------------------------

export default function ConversationSidebar({
  onSelect,
  onNewChat,
  activeConversationId,
  className = "",
}: ConversationSidebarProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/advisor/conversations");
      if (!res.ok) return;
      const data = (await res.json()) as { conversations?: ConversationListItem[] };
      setConversations(data.conversations ?? []);
    } catch {
      // swallow — sidebar failure must not affect chat
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (session?.user) {
      void fetchConversations();
    }
  }, [session?.user, fetchConversations]);

  // Re-fetch whenever the active conversation changes — picks up newly created ones
  useEffect(() => {
    if (session?.user) {
      void fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // Not signed in — sidebar renders nothing
  if (!session?.user) return null;

  const handleSelect = (id: string) => {
    onSelect(id);
    void fetchConversations();
  };

  const handleNewChat = () => {
    onNewChat();
    void fetchConversations();
  };

  return (
    <div className={`flex flex-col bg-[#0D1117] overflow-hidden ${className}`}>
      {/* New Chat button */}
      <div className="px-3 py-3 shrink-0">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-klo-text bg-white/5 hover:bg-white/10 border border-klo-slate transition-colors cursor-pointer"
        >
          <MessageSquarePlus size={15} className="text-klo-muted shrink-0" />
          New Chat
        </button>
      </div>

      {/* Section label */}
      <div className="px-4 pb-2 shrink-0">
        <span className="text-xs text-klo-muted uppercase tracking-wider">
          Recent
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && conversations.length === 0 ? (
          <div className="px-4 py-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-klo-muted leading-relaxed">
              No conversations yet. Start chatting to save your history.
            </p>
          </div>
        ) : (
          <ul className="px-2 pb-4 space-y-0.5">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <li key={conv.id}>
                  <button
                    onClick={() => handleSelect(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${
                      isActive
                        ? "bg-[#2764FF]/10 border-l-2 border-klo-gold pl-[10px]"
                        : "hover:bg-white/5 border-l-2 border-transparent pl-[10px]"
                    }`}
                  >
                    <p
                      className={`text-sm leading-snug truncate ${
                        isActive ? "text-klo-text font-medium" : "text-klo-text"
                      }`}
                    >
                      {conv.title}
                    </p>
                    <p className="text-[11px] text-klo-muted mt-0.5">
                      {timeAgo(conv.updated_at)}{" "}
                      <span aria-hidden="true">·</span>{" "}
                      {conv.message_count}{" "}
                      {conv.message_count === 1 ? "msg" : "msgs"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
