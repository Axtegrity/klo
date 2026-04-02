import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Origins used by Capacitor native apps
const CAPACITOR_ORIGINS = [
  "capacitor://localhost", // iOS
  "https://localhost",     // Android
];

// Routes always reachable even when MFA verification is pending
const MFA_EXEMPT_PREFIXES = [
  "/api/auth/",        // all NextAuth routes + MFA API routes
  "/auth/",            // sign-in, sign-up, mfa-verify pages
  "/_next/",
  "/favicon",
];

function isMfaExempt(pathname: string): boolean {
  return MFA_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
}

function addCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get("origin") ?? "";
    const isCapacitor = CAPACITOR_ORIGINS.includes(origin);
    const isApiRoute = pathname.startsWith("/api/");

    // Handle CORS preflight for Capacitor on API routes
    if (request.method === "OPTIONS" && isCapacitor && isApiRoute) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // MFA gate — redirect to challenge page when token has mfaPending=true.
    // The JWT callback sets this flag on first login when mfa_enabled=true.
    const token = request.nextauth?.token as ({ mfaPending?: boolean } & Record<string, unknown>) | null;
    if (token?.mfaPending === true && !isMfaExempt(pathname)) {
      const mfaUrl = new URL("/auth/mfa-verify", request.url);
      mfaUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(mfaUrl);
    }

    const response = NextResponse.next();

    // Add CORS headers for Capacitor origins on API routes
    if (isCapacitor && isApiRoute) {
      addCorsHeaders(response, origin);
    }

    return response;
  },
  {
    callbacks: {
      authorized({ token, req }) {
        // Always allow API routes (CORS preflight has no token)
        if (req.nextUrl.pathname.startsWith("/api/")) return true;
        // Return true if the user has a valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    // CORS handling for Capacitor native app
    "/api/:path*",
    // Auth protection (temporarily disabled for demo preview)
    // "/profile/:path*",
    // "/strategy-rooms/:path*",
    // "/vault/:path*",
    // "/advisor/:path*",
    // "/admin/:path*",
  ],
};
