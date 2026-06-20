import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// ── Mock Users ───────────────────────────────────────────────────────────
// Note: aligned with the demo credentials advertised on /login page:
//   admin@rescuehub.org / admin123
//   staff@rescuehub.org / staff123
// IDs are valid v4 UUIDs. Crypto-grade random (not zero-padded).
// Several strcmp-strict ID validators — including Prisma's `userId: @id @default(uuid())`
// and any consumer running its own RFC4122 v4 variant/version check —
// reject `00000000-...` form because char 12 (version nibble) must be
// `4` and char 16 (variant nibble) must be `8|9|a|b`. Real v4s only.
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