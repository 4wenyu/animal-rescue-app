/**
 * Find-or-create a CITIZEN with an ACTIVE wallet. Used by email register and
 * Google OAuth first sign-in so preview credit + wallet stay in one place.
 */

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { grantPreviewSearchCredit } from "@/lib/services/tokenService";

export type EnsuredCitizen = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  created: boolean;
};

export async function ensureCitizenUser(opts: {
  email: string;
  displayName: string;
  passwordHash?: string | null;
}): Promise<EnsuredCitizen> {
  const email = opts.email.trim().toLowerCase();
  const displayName = opts.displayName.trim().slice(0, 80) || email.split("@")[0];

  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      userId: true,
      email: true,
      displayName: true,
      role: true,
    },
  });
  if (existing) {
    return {
      userId: existing.userId,
      email: existing.email,
      displayName: existing.displayName,
      role: existing.role,
      created: false,
    };
  }

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          displayName,
          passwordHash: opts.passwordHash ?? null,
          role: "CITIZEN",
          marketingOptIn: false,
        },
      });
      await tx.tokenWallet.create({
        data: {
          userId: created.userId,
          cachedBalance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
          lifetimeExpired: 0,
          status: "ACTIVE",
        },
      });
      return created;
    });

    try {
      await grantPreviewSearchCredit(user.userId);
    } catch (creditErr) {
      console.error(
        "[ensureCitizenUser] Preview search credit failed; account still created:",
        creditErr,
      );
    }

    return {
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      created: true,
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const raced = await prisma.user.findUniqueOrThrow({
        where: { email },
        select: {
          userId: true,
          email: true,
          displayName: true,
          role: true,
        },
      });
      return {
        userId: raced.userId,
        email: raced.email,
        displayName: raced.displayName,
        role: raced.role,
        created: false,
      };
    }
    throw err;
  }
}
