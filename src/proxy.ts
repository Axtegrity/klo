import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Origins used by Capacitor native apps
const CAPACITOR_ORIGINS = [
  "capacitor://localhost", // iOS
  "https://localhost",     // Android
];

function addCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export default withAuth(
  function middleware(request: NextRequest) {
    const origin = request.headers.get("origin") ?? "";
    const isCapacitor = CAPACITOR_ORIGINS.includes(origin);
    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

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
