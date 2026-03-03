import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    // If the user is authenticated, allow the request
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
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
    // Temporarily disabled for demo preview
    // "/profile/:path*",
    // "/strategy-rooms/:path*",
    // "/vault/:path*",
    // "/advisor/:path*",
  ],
};
