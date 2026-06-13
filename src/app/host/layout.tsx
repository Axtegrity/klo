import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Host Dashboard — KLO" };

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV !== "development") {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session?.user) {
      redirect("/auth/signin");
    }

    if (!["owner", "admin"].includes(role ?? "")) {
      redirect("/");
    }
  }

  return <>{children}</>;
}
