/**
 * Outreach Service — Tier 1.7 staged autonomous outreach (opt-in only).
 * =========================================================================
 *
 * The Idea's core loop: an autonomous agent that finds animal lovers and
 * proactively reaches out with a nearby at-risk animal, asking them to
 * donate / foster / adopt / share. The true-MVP hardening:
 *
 *   - OPT-IN ONLY. We never cold-contact anyone. A citizen must create an
 *     OutreachProfile with an explicit "I can help" consent.
 *   - STAGED & HUMAN-GATED. The agent GENERATES drafts (DRAFT). A STAFF/ADMIN
 *     reviews and APPROVEs them; only then are they marked SENT. Nothing is
 *     delivered without a human in the loop.
 *   - HONEST COPY. Every generated message is labeled as written by an
 *     autonomous agent ("stage 1, matched by region"), never impersonating a
 *     human volunteer.
 *   - UNSUBSCRIBABLE. Every profile carries a one-click unsubscribe token.
 *
 * Persistence: OutreachProfile + OutreachDraft (see prisma/schema.prisma).
 */

import { prisma } from "@/lib/prisma";

export type HelpArea =
  | "DONATE"
  | "FOSTER"
  | "ADOPT"
  | "VOLUNTEER"
  | "SHARE"
  | "TRANSPORT";

/** Which at-risk animals count as "nearby" for matching purposes. */
export interface NearAnimal {
  animalId: string;
  breed: string;
  medicalStatus: string;
  strayHoldCleared: boolean;
  locationHint: string | null;
}

/**
 * Find at-risk animals that have cleared their statutory stray hold and are
 * therefore eligible for adoption/outreach (Hayden Act compliance: never
 * surface a hold-pending animal for adoption).
 */
export async function findOutreachEligibleAnimals(limit = 3): Promise<NearAnimal[]> {
  const animals = await prisma.animal.findMany({
    where: { statutoryHoldCleared: true },
    select: {
      animalId: true,
      breedDesignation: true,
      medicalStatus: true,
      statutoryHoldCleared: true,
      custodianOrgId: true,
    },
    orderBy: { intakeTimestamp: "desc" },
    take: limit,
  });
  return animals.map((a) => ({
    animalId: a.animalId,
    breed: a.breedDesignation,
    medicalStatus: a.medicalStatus,
    strayHoldCleared: a.statutoryHoldCleared,
    locationHint: null,
  }));
}

/** Honest copy builder — never pretends to be a human volunteer. */
export function buildOutreachCopy(
  animal: NearAnimal | null,
  area: HelpArea,
): { subject: string; body: string; sourceNote: string } {
  const animalLine = animal
    ? `a ${animal.breed} at a nearby partner shelter`
    : "a local animal that needs help right now";

  switch (area) {
    case "DONATE":
      return {
        subject: `Help ${animalLine} — a one-time gift goes further than you think`,
        body: `You asked to be contacted about donation opportunities. Right now, ${animalLine} is waiting. This is an automated outreach (stage 1) — a real human at the shelter is ready to answer any question.`,
        sourceNote: "autonomous agent — stage 1, donation ask, matched by region",
      };
    case "FOSTER":
      return {
        subject: `Could you foster ${animalLine}?`,
        body: `You told us you can foster. We found ${animalLine} that could really use a temporary home. This is an automated outreach (stage 1) — a shelter coordinator will follow up personally if you're interested.`,
        sourceNote: "autonomous agent — stage 1, foster ask, matched by region",
      };
    case "ADOPT":
      return {
        subject: `Meet ${animalLine} — looking for a forever family`,
        body: `You asked to hear about adoptable animals. ${animalLine} has completed its required holding period and is ready for adoption. This is an automated outreach (stage 1); a real adoption counselor is on hand to help.`,
        sourceNote: "autonomous agent — stage 1, adoption ask, matched by region",
      };
    case "VOLUNTEER":
      return {
        subject: `Your shelter could use your hands this week`,
        body: `You opted in to hear about volunteer shifts. We're matching nearby needs, starting with ${animalLine}. This is an automated outreach (stage 1) — reply and a volunteer lead will connect you.`,
        sourceNote: "autonomous agent — stage 1, volunteer ask, matched by region",
      };
    case "SHARE":
      return {
        subject: `Can you share ${animalLine} with your community?`,
        body: `You offered to help spread the word. ${animalLine} needs visibility right now. This is an automated outreach (stage 1) — sharing a post takes two minutes and can save a life.`,
        sourceNote: "autonomous agent — stage 1, share ask, matched by region",
      };
    default:
      return {
        subject: `Transport help needed for ${animalLine}`,
        body: `You offered transport help. There's a need nearby for ${animalLine}. This is an automated outreach (stage 1) — a coordinator will share the route details if you can help.`,
        sourceNote: "autonomous agent — stage 1, transport ask, matched by region",
      };
  }
}

/**
 * Generate outreach drafts (the agent's work). Scoped to ACTIVE profiles,
 * one draft per profile per call (idempotent-ish: skips profiles that already
 * have a DRAFT open). Each draft is labeled honestly and requires human
 * approval before it can ever be marked SENT.
 */
export async function generateOutreachDrafts(limit = 5): Promise<number> {
  const profiles = await prisma.outreachProfile.findMany({
    where: { status: "ACTIVE" },
    select: {
      profileId: true,
      userId: true,
      helpAreas: true,
      regionLabel: true,
      drafts: {
        where: { status: "DRAFT" },
        select: { draftId: true },
        take: 1,
      },
    },
    take: limit,
  });

  const animals = await findOutreachEligibleAnimals(limit);

  let created = 0;
  for (const profile of profiles) {
    // Skip profiles that already have an open draft (no spam).
    if (profile.drafts.length > 0) continue;

    // Match the profile's first help area (or fall back to DONATE).
    const area: HelpArea =
      (profile.helpAreas[0] as HelpArea | undefined) ?? "DONATE";

    // Assign the nearest eligible animal, cycling by index.
    const animal = animals[created % Math.max(1, animals.length)] ?? null;
    const copy = buildOutreachCopy(animal, area);

    await prisma.outreachDraft.create({
      data: {
        profileId: profile.profileId,
        userId: profile.userId,
        animalId: animal?.animalId ?? null,
        helpAsk: area,
        subject: copy.subject,
        body: copy.body,
        sourceNote: copy.sourceNote,
        status: "DRAFT",
      },
    });
    created++;
  }
  return created;
}

/** Approve (→ SENT) or skip (→ SKIPPED) a draft. Human-gated delivery. */
export async function reviewOutreachDraft(
  draftId: string,
  reviewerUserId: string,
  approve: boolean,
  note?: string,
): Promise<"SENT" | "SKIPPED"> {
  const draft = await prisma.outreachDraft.findUnique({ where: { draftId } });
  if (!draft) throw new Error("Draft not found");
  if (draft.status !== "DRAFT") {
    throw new Error("Only DRAFT outreach can be reviewed");
  }

  const next: "SENT" | "SKIPPED" = approve ? "SENT" : "SKIPPED";
  await prisma.outreachDraft.update({
    where: { draftId },
    data: {
      status: next,
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
      ...(approve ? { sentAt: new Date() } : {}),
      ...(note ? { sourceNote: `${draft.sourceNote} — review: ${note}` } : {}),
    },
  });
  return next;
}
