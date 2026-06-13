import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MonitorContent from "./_MonitorContent";

export const metadata = { title: "Monitor — KLO" };

export default async function MonitorPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !["owner", "admin"].includes(role)) {
    redirect("/");
  }

  return <MonitorContent />;
}
