import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// ── Mock Users ───────────────────────────────────────────────────────────
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@rescuehub.com",
    password: "password123",
    name: "Admin User",
    role: "ADMIN" as const,
  },
  {
    id: "2",
    email: "staff@rescuehub.com",
    password: "password123",
    name: "Staff User",
    role: "STAFF" as const,
  },
];

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@rescuehub.com" },
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

      if (isProtected && !isLoggedIn) {
        const redirectUrl = new URL("/login", nextUrl.origin);
        redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(redirectUrl);
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