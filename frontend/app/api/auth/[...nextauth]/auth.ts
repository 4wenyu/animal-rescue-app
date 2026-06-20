import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// ── Mock Users ───────────────────────────────────────────────────────────
// Note: aligned with the demo credentials advertised on /login page:
//   admin@rescuehub.org / admin123
//   staff@rescuehub.org / staff123
// IDs are valid UUIDs because `TokenTransactionDataSchema.userId` and
// other Epic 2 flows call `z.string().uuid()` on the session-derived id.
// Using plain "1"/"2" would 400 every authenticated POST.
const MOCK_USERS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@rescuehub.org",
    password: "admin123",
    name: "Admin User",
    role: "ADMIN" as const,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "staff@rescuehub.org",
    password: "staff123",
    name: "Staff User",
    role: "STAFF" as const,
  },
];

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@rescuehub.org" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = MOCK_USERS.find(
          (u) => u.email === email && u.password === password,
        );

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);