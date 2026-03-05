import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServiceSupabase } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/auth/signin",
  },

  providers: [
    // Dev-only credential login (bypasses OAuth)
    CredentialsProvider({
      id: "dev-admin",
      name: "Dev Admin",
      credentials: {},
      async authorize() {
        return {
          id: "36af99e8-9207-4393-b63f-122d11ed26aa",
          name: "Keith (Dev)",
          email: "admin@klo.dev",
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID ?? "",
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionTier = "free";
        token.role = "user";
      }

      // Dev admin bypass
      if (token.email === "admin@klo.dev") {
        token.role = "admin";
        token.subscriptionTier = "executive";
        return token;
      }

      // Refresh role from DB on every token refresh (cached in JWT)
      if (token.id) {
        try {
          const supabase = getServiceSupabase();
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_tier, role")
            .eq("id", token.id)
            .single();

          if (profile) {
            token.subscriptionTier = profile.subscription_tier ?? "free";
            token.role = profile.role ?? "user";
          }
        } catch {
          // If DB query fails, keep existing token values
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { subscriptionTier?: string }).subscriptionTier =
          token.subscriptionTier as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
