"use client";

import { useSession } from "next-auth/react";

type ConferenceRole = "admin" | "moderator" | "presenter" | "attendee" | null;

export function useConferenceRoles() {
  const { data: session } = useSession();

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const appRole = (session?.user as { role?: string } | undefined)?.role;

  // Pure derivation from session — no useState / useEffect needed.
  // App-level admin is always conference admin; signed-in users default to
  // attendee. The verifyConferenceRole helper handles server-side checks.
  // Cast to the wider ConferenceRole union so downstream "moderator" /
  // "presenter" comparisons remain type-valid for future role expansion.
  const conferenceRole: ConferenceRole =
    appRole === "admin" ? "admin" : userId ? ("attendee" as ConferenceRole) : null;

  const isAdmin = conferenceRole === "admin";
  const isModerator = conferenceRole === "moderator" || isAdmin;
  const isPresenter = conferenceRole === "presenter" || isModerator;
  const isAuthenticated = !!userId;

  return {
    conferenceRole,
    isAdmin,
    isModerator,
    isPresenter,
    isAuthenticated,
    userId,
    loading: false,
  };
}
