import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase";

// Credential accounts
const OWNER_EMAIL = "keith@keithlodom.io";
const OWNER_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_EMAIL = "admin@keithlodom.io";
const ADMIN_ID = "00000000-0000-0000-0000-000000000002";
const MODERATOR_EMAIL = "moderator@keithlodom.io";
const MODERATOR_ID = "00000000-0000-0000-0000-000000000003";
const TEST1_EMAIL = "appletest1@keithlodom.ai";
const TEST1_ID = "00000000-0000-0000-0000-000000000004";
const TEST2_EMAIL = "appletest2@keithlodom.ai";
const TEST2_ID = "00000000-0000-0000-0000-000000000005";

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
  {
    email: TEST1_EMAIL,
    id: TEST1_ID,
    name: "Apple Test 1",
    envVar: "APPLE_TEST_PASSWORD",
    role: "admin" as const,
  },
  {
    email: TEST2_EMAIL,
    id: TEST2_ID,
    name: "Apple Test 2",
    envVar: "APPLE_TEST_PASSWORD",
    role: "admin" as const,
  },
];

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours — stolen tokens expire rather than living forever
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: "/auth/signin",
  },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "none" as const,
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "none" as const,
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: false,
        sameSite: "none" as const,
        path: "/",
        secure: true,
      },
    },
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

        // Check hardcoded admin/owner/moderator accounts first
        for (const account of CREDENTIAL_ACCOUNTS) {
          const password = process.env[account.envVar]?.trim();
          if (credentials.email === account.email && password) {
            if (!password.startsWith("$2")) {
              console.error(`[Auth] Credential account ${account.email} has a plaintext password — rejecting. Set a bcrypt hash in your environment.`);
              return null;
            }
            const valid = await compare(credentials.password, password);
            if (valid) {
              return {
                id: account.id,
                name: account.name,
                email: account.email,
              };
            }
          }
        }

        // Check database for email/password users
        try {
          const supabase = getServiceSupabase();
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email, full_name, password_hash, disabled")
            .eq("email", credentials.email.toLowerCase())
            .single();

          if (profile?.password_hash) {
            const valid = await compare(
              credentials.password,
              profile.password_hash
            );
            if (valid) {
              // Reject disabled accounts before issuing a session
              if (profile.disabled) {
                return null;
              }
              return {
                id: profile.id,
                name: profile.full_name ?? profile.email,
                email: profile.email,
              };
            }
          }
        } catch {
          // DB lookup failed — fall through to return null
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session: updatedSession }) {
      if (user) {
        token.id = user.id;
        token.subscriptionTier = "free";
        token.role = "user";
        token.mfaPending = false;
        // Stamp token issuance time on fresh sign-in
        token.iat = Math.floor(Date.now() / 1000);
      }

      // Client called update({ mfaPending: false }) after successful MFA verify
      if (trigger === "update" && updatedSession?.mfaPending === false) {
        token.mfaPending = false;
      }

      // Rotate token timestamp every hour so clients must re-verify
      const tokenAge = Math.floor(Date.now() / 1000) - ((token.iat as number) ?? 0);
      if (tokenAge > 3600) {
        token.iat = Math.floor(Date.now() / 1000);
      }

      // Credential account role mapping
      const credAccount = CREDENTIAL_ACCOUNTS.find(
        (a) => a.email === token.email
      );
      if (credAccount) {
        token.role = credAccount.role;
        token.subscriptionTier = "executive";
        // Internal credential accounts bypass MFA
        token.mfaPending = false;
        // Still check DB for updated name
        try {
          const supabase = getServiceSupabase();
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", credAccount.id)
            .single();
          if (profile?.full_name) {
            token.name = profile.full_name;
          }
        } catch {}
        return token;
      }

      // Refresh role + name from DB on every token refresh (cached in JWT).
      // On first login (user object present), also check mfa_enabled.
      if (token.id) {
        try {
          const supabase = getServiceSupabase();
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_tier, role, full_name, mfa_enabled")
            .eq("id", token.id as string)
            .single();

          if (profile) {
            token.subscriptionTier = profile.subscription_tier ?? "free";
            token.role = profile.role ?? "user";
            if (profile.full_name) {
              token.name = profile.full_name;
            }
            // Only set mfaPending on fresh login — never on token refresh.
            // If the token already has mfaPending=false it means the user
            // already passed MFA this session.
            if (user && profile.mfa_enabled) {
              token.mfaPending = true;
            }
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
        (session.user as { mfaPending?: boolean }).mfaPending =
          (token.mfaPending as boolean) ?? false;
      }
      return session;
    },
  },
};
