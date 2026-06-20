/**
 * Prisma singleton for Next.js App Router.
 *
 * Avoids multiple client instances during hot-reload in development.
 * Import this from any server-side file (API routes, Server Components,
 * Cron jobs) — never from client components.
 *
 * Prerequisites:
 *   - `@prisma/client` installed in node_modules
 *   - `npx prisma generate` has been run from the project root
 *
 * Usage:
 *   import { prisma } from "@/lib/prisma";
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? (["query", "error", "warn"] as const)
        : (["error"] as const),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}