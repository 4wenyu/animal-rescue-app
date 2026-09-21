/**
 * N3 — enqueue staff-review drafts for opted-in helpers near last-seen.
 * Never cold-contacts. Never auto-sends; delivery stays human-gated.
 */
import { after } from "next/server";

import { prisma } from "@/lib/prisma";
import { geocodeLabel } from "@/lib/geo/geocode";
import { isWithinRadiusMiles } from "@/lib/geo/haversine";
import { sendTelegramMessage } from "@/src/lib/telegram";

const DEFAULT_RADIUS_MI = 25;

function radiusMiles(): number {
  const raw = Number(process.env.OUTREACH_RADIUS_MILES ?? DEFAULT_RADIUS_MI);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RADIUS_MI;
}

export type RadiusEnqueueResult = {
  geocoded: boolean;
  matched: number;
  created: number;
};

/**
 * Geocode last-seen (if needed), persist coords, create DRAFT rows for
 * ACTIVE helpers within radius. Safe to call after search create.
 */
export async function enqueueRadiusAlertsForSearch(
  searchId: string,
): Promise<RadiusEnqueueResult> {
  const search = await prisma.lostPetSearch.findUnique({
    where: { searchId },
    select: {
      searchId: true,
      species: true,
      breed: true,
      colorMarkings: true,
      lastSeen: true,
      lastSeenLat: true,
      lastSeenLng: true,
      userId: true,
    },
  });
  if (!search?.lastSeen) {
    return { geocoded: false, matched: 0, created: 0 };
  }

  let lat = search.lastSeenLat;
  let lng = search.lastSeenLng;
  let geocoded = lat != null && lng != null;

  if (lat == null || lng == null) {
    const point = await geocodeLabel(search.lastSeen);
    if (!point) return { geocoded: false, matched: 0, created: 0 };
    lat = point.lat;
    lng = point.lng;
    geocoded = true;
    await prisma.lostPetSearch.update({
      where: { searchId },
      data: { lastSeenLat: lat, lastSeenLng: lng },
    });
  }

  const radius = radiusMiles();
  const profiles = await prisma.outreachProfile.findMany({
    where: {
      status: "ACTIVE",
      lat: { not: null },
      lng: { not: null },
      // Never alert the pet owner about their own search.
      userId: { not: search.userId },
    },
    select: {
      profileId: true,
      userId: true,
      lat: true,
      lng: true,
      helpAreas: true,
      regionLabel: true,
    },
    take: 200,
  });

  const nearby = profiles.filter(
    (p) =>
      p.lat != null &&
      p.lng != null &&
      isWithinRadiusMiles(lat!, lng!, p.lat, p.lng, radius),
  );

  let created = 0;
  const species = search.species ?? "pet";
  const breed = search.breed ? ` (${search.breed})` : "";
  const markings = search.colorMarkings ? ` — ${search.colorMarkings}` : "";
  const subject = `Lost ${species} near you`;
  const body = [
    `A neighbor reported a lost ${species}${breed}${markings}.`,
    `Last seen: ${search.lastSeen}.`,
    `Open the radar: /radar/${search.searchId}`,
    "",
    "You opted in to help nearby pets. Staff will review before any message is sent to your Telegram.",
  ].join("\n");

  for (const profile of nearby) {
    const helpAsk = profile.helpAreas.includes("SHARE")
      ? "SHARE"
      : profile.helpAreas.includes("TRANSPORT")
        ? "TRANSPORT"
        : profile.helpAreas[0] ?? "SHARE";

    try {
      await prisma.outreachDraft.create({
        data: {
          profileId: profile.profileId,
          userId: profile.userId,
          lostPetSearchId: search.searchId,
          subject,
          body,
          helpAsk: helpAsk as never,
          sourceNote: `autonomous agent — N3 radius (${radius} mi), matched by last-seen coords`,
          status: "DRAFT",
        },
      });
      created += 1;
    } catch {
      // Unique (profileId, lostPetSearchId) — idempotent skip.
    }
  }

  if (created > 0 && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    void sendTelegramMessage(
      [
        `📡 *Radius drafts queued*`,
        `${created} helper draft(s) within ${radius} mi of last-seen.`,
        `Search: \`${search.searchId}\``,
        `Review: /outreach/review`,
      ].join("\n"),
      "Markdown",
    );
  }

  return { geocoded, matched: nearby.length, created };
}

/** Schedule radius enqueue after the HTTP response (non-blocking). */
export function scheduleRadiusAlertsForSearch(searchId: string): void {
  after(() => {
    void enqueueRadiusAlertsForSearch(searchId).catch((err) => {
      console.error("[radiusAlert] enqueue failed:", err);
    });
  });
}
