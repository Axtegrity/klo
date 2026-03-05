import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

export async function GET() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "No secret configured" }, { status: 500 });
  }

  const token = await encode({
    secret,
    token: {
      id: "36af99e8-9207-4393-b63f-122d11ed26aa",
      name: "Keith (Dev)",
      email: "admin@klo.dev",
      role: "admin",
      subscriptionTier: "executive",
    },
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  const response = NextResponse.redirect(new URL("/admin", process.env.NEXTAUTH_URL || "http://localhost:3000"));

  response.cookies.set("next-auth.session-token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
