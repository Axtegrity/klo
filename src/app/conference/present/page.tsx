import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PresenterRemote from "@/features/conference/admin/PresenterRemote";

export const metadata = { title: "Presenter Remote — KLO" };

interface PageProps {
  searchParams: Promise<{ event_id?: string }>;
}

export default async function PresentPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !["owner", "admin"].includes(role)) {
    redirect("/auth/signin");
  }

  const { event_id: eventId } = await searchParams;
  if (!eventId) {
    redirect("/conference");
  }

  return (
    <div className="min-h-screen bg-klo-dark pt-safe">
      {/* Minimal header — no nav, no distractions */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider">
          Presenter Remote
        </p>
        <Link
          href="/conference"
          className="text-xs text-klo-muted hover:text-klo-text transition-colors"
        >
          ← Exit
        </Link>
      </div>

      <PresenterRemote eventId={eventId} />
    </div>
  );
}
