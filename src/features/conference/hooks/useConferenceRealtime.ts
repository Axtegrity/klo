"use client";

import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeCallbacks {
  onSettingsChange?: () => void;
  onPollsChange?: () => void;
  onVotesChange?: () => void;
  onQuestionsChange?: () => void;
  onUpvotesChange?: () => void;
  onWordCloudChange?: () => void;
  onSessionsChange?: () => void;
  onLikesChange?: () => void;
  onAnnouncementsChange?: () => void;
}

type CallbackKey = keyof RealtimeCallbacks;

// Map table names to callback keys
const TABLE_TO_CALLBACK: Record<string, CallbackKey> = {
  app_settings: "onSettingsChange",
  conference_polls: "onPollsChange",
  conference_poll_votes: "onVotesChange",
  conference_questions: "onQuestionsChange",
  conference_question_upvotes: "onUpvotesChange",
  conference_word_cloud: "onWordCloudChange",
  conference_sessions: "onSessionsChange",
  conference_question_likes: "onLikesChange",
  conference_announcements: "onAnnouncementsChange",
};

// Shared singleton channel + subscriber registry
let sharedChannel: RealtimeChannel | null = null;
let subscriberCount = 0;
const subscribers = new Set<{ current: RealtimeCallbacks }>();

// Debounce timers per table to prevent thundering herd
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const DEBOUNCE_MS = 500;

function notifySubscribers(table: string) {
  // Clear any existing debounce for this table
  if (debounceTimers[table]) {
    clearTimeout(debounceTimers[table]);
  }

  debounceTimers[table] = setTimeout(() => {
    const callbackKey = TABLE_TO_CALLBACK[table];
    if (!callbackKey) return;

    for (const ref of subscribers) {
      ref.current[callbackKey]?.();
    }
  }, DEBOUNCE_MS);
}

function ensureChannel() {
  if (sharedChannel) return;

  const supabase = getSupabase();
  const tables = Object.keys(TABLE_TO_CALLBACK);

  let channel = supabase.channel("conference-realtime");

  for (const table of tables) {
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => notifySubscribers(table)
    );
  }

  sharedChannel = channel.subscribe();
}

function destroyChannel() {
  if (!sharedChannel) return;
  const supabase = getSupabase();
  supabase.removeChannel(sharedChannel);
  sharedChannel = null;

  // Clear all debounce timers
  for (const key of Object.keys(debounceTimers)) {
    clearTimeout(debounceTimers[key]);
    delete debounceTimers[key];
  }
}

export function useConferenceRealtime(callbacks: RealtimeCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    subscribers.add(callbacksRef);
    subscriberCount++;
    ensureChannel();

    return () => {
      subscribers.delete(callbacksRef);
      subscriberCount--;
      if (subscriberCount === 0) {
        destroyChannel();
      }
    };
  }, []);
}
