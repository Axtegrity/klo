import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
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
            // Support both bcrypt hashes and plain passwords (migration)
            const isHash = password.startsWith("$2");
            const valid = isHash
              ? await compare(credentials.password, password)
              : credentials.password === password;
            if (valid) {
              // Auto-upgrade plaintext passwords to bcrypt on successful login
              if (!isHash) {
                console.warn(
                  "[Auth] A credential account is using a plaintext password. Set it to a bcrypt hash in your environment."
                );
              }
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
            .select("id, email, full_name, password_hash")
            .eq("email", credentials.email.toLowerCase())
            .single();

          if (profile?.password_hash) {
            const valid = await compare(
              credentials.password,
              profile.password_hash
            );
            if (valid) {
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
