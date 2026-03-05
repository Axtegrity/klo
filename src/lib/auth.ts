import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServiceSupabase } from "@/lib/supabase";

// Credential accounts
const OWNER_EMAIL = "keith@keithlodom.io";
const OWNER_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_EMAIL = "admin@keithlodom.io";
const ADMIN_ID = "00000000-0000-0000-0000-000000000002";
const MODERATOR_EMAIL = "moderator@keithlodom.io";
const MODERATOR_ID = "00000000-0000-0000-0000-000000000003";

const CREDENTIAL_ACCOUNTS = [
  {
    email: OWNER_EMAIL,
    id: OWNER_ID,
    name: "Keith L. Odom",
    envVar: "OWNER_PASSWORD",
    role: "owner" as const,
  },
  {
    email: ADMIN_EMAIL,
    id: ADMIN_ID,
    name: "KLO Admin",
    envVar: "ADMIN_PASSWORD",
    role: "admin" as const,
  },
  {
    email: MODERATOR_EMAIL,
    id: MODERATOR_ID,
    name: "KLO Moderator",
    envVar: "MODERATOR_PASSWORD",
    role: "moderator" as const,
  },
];

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/auth/signin",
  },

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        for (const account of CREDENTIAL_ACCOUNTS) {
          const password = process.env[account.envVar];
          if (
            credentials.email === account.email &&
            password &&
            credentials.password === password
          ) {
            return {
              id: account.id,
              name: account.name,
              email: account.email,
            };
          }
        }
        return null;
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

      // Credential account role mapping
      const credAccount = CREDENTIAL_ACCOUNTS.find(
        (a) => a.email === token.email
      );
      if (credAccount) {
        token.role = credAccount.role;
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
