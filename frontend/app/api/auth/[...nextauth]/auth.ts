import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";

// ── Development-only demo credentials ──────────────────────────────────────
// Retained so a fresh checkout can log in before a real user is seeded. They
// are REFUSED in production and in any environment that has not explicitly
// opted in via AUTH_ALLOW_MOCK_USERS=true. Production must always resolve
// against `users.passwordHash` in the database.
const MOCK_USERS = [
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    email: "admin@rescuehub.org",
    password: "admin123",
    name: "Admin User",
    role: "ADMIN" as const,
  },
  {
    id: "a77484df-f236-407b-80a2-218f262176c4",
    email: "staff@rescuehub.org",
    password: "staff123",
    name: "Staff User",
    role: "STAFF" as const,
  },
];

async function authorizeAgainstDatabase(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.userId,
    email: user.email,
    name: user.displayName,
    role: user.role,
  };
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@rescuehub.org" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        // Primary path: real user with a scrypt-hashed credential in Postgres.
        const realUser = await authorizeAgainstDatabase(email, password);
        if (realUser) return realUser;

        // Secondary path: demo credentials, forbidden outside explicit dev opt-in.
        const mockAllowed =
          process.env.NODE_ENV !== "production" &&
          process.env.AUTH_ALLOW_MOCK_USERS === "true";
        if (!mockAllowed) return null;

        const mock = MOCK_USERS.find(
          (u) => u.email === email && u.password === password,
        );
        if (!mock) return null;

        return {
          id: mock.id,
          email: mock.email,
          name: mock.name,
          role: mock.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = (user as unknown as Record<string, unknown>).role as string;
        token.id = user.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).role = token.role as string;
        (session.user as unknown as Record<string, unknown>).id = token.id as string;
      }
      return session;
    },
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ["/dashboard", "/intake", "/medical"];
      const isProtected = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path),
      );

      // NextAuth v5 `authorized` callbacks must return a boolean (or a
      // NextResponse). Returning a bare `Response.redirect()` here is
      // incorrect — it would throw at the edge. Actual gating is performed
      // by proxy.ts, which calls `auth()` directly and returns a proper
      // NextResponse.redirect on failure. This callback is therefore just a
      // permission fence.
      if (isProtected && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  // NextAuth v5 refuses to serve /api/auth/* unless it trusts the request
  // host. `next dev` trusts localhost automatically, but `next start` and
  // reverse-proxy deployments do not — which surfaced as "UntrustedHost" on
  // every sign-in attempt in production builds. Trusting the host is the
  // documented deployment default; combine with AUTH_URL for a pinned origin.
  trustHost: true,
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
