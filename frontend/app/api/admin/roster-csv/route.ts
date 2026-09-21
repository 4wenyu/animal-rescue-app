import { NextResponse } from "next/server";

import { requireRole } from "@/lib/api/helpers";
import { rosterAnimalId } from "@/lib/medicalLog";
import { prisma } from "@/lib/prisma";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";
import {
  parseRosterCsv,
  ROSTER_CSV_MAX_ROWS,
} from "@/lib/services/rosterCsvIngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTODIAN_ORG_ID = "f4eedd11-2222-4000-a000-000000000001";

/**
 * Staff CSV roster import (N0).
 * Body: text/csv or multipart file field `file` / `csv`.
 */
export async function POST(req: Request) {
  const gate = await requireRole("STAFF", "ADMIN");
  if (!gate.ok) return gate.response;

  const limited = await checkRateLimitAsync(
    `roster-csv:${gate.user.id}:${getClientIp(req)}`,
    10,
    60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too Many Requests", message: "Slow down roster imports." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  let text = "";
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") ?? form.get("csv");
      if (typeof file === "string") {
        text = file;
      } else if (file && typeof file === "object" && "text" in file) {
        text = await (file as File).text();
      }
    } else {
      text = await req.text();
    }
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Could not read CSV body." },
      { status: 400 },
    );
  }

  if (!text.trim()) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Paste CSV text or upload a .csv file (max 100 rows).",
      },
      { status: 400 },
    );
  }

  const parsed = parseRosterCsv(text);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Validation Error", message: parsed.error },
      { status: 400 },
    );
  }

  const dryRun =
    new URL(req.url).searchParams.get("dryRun") === "1" ||
    new URL(req.url).searchParams.get("dryRun") === "true";

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      rows: parsed.rows,
      skipped: parsed.skipped,
      maxRows: ROSTER_CSV_MAX_ROWS,
    });
  }

  try {
    await prisma.organization.upsert({
      where: { orgId: CUSTODIAN_ORG_ID },
      update: {},
      create: {
        orgId: CUSTODIAN_ORG_ID,
        orgType: "MUNICIPAL_SHELTER",
        einNumber: "00-0000000",
      },
    });

    let upserted = 0;
    for (const row of parsed.rows) {
      const animalId = rosterAnimalId(row.id);
      await prisma.animal.upsert({
        where: { animalId },
        create: {
          animalId,
          custodianOrgId: CUSTODIAN_ORG_ID,
          name: row.name,
          species: row.species,
          breedDesignation: row.breed,
          ageYears: row.ageYears,
          sex: row.sex,
          personality: row.personality,
          imageUrl: row.imageUrl,
          listingStatus: "AVAILABLE",
          medicalStatus: "HEALTHY_HOLD",
          statutoryHoldCleared: row.holdCleared,
        },
        update: {
          name: row.name,
          species: row.species,
          breedDesignation: row.breed,
          ageYears: row.ageYears,
          sex: row.sex,
          personality: row.personality,
          imageUrl: row.imageUrl,
          statutoryHoldCleared: row.holdCleared,
          listingStatus: "AVAILABLE",
        },
      });
      upserted += 1;
    }

    return NextResponse.json({
      ok: true,
      upserted,
      skipped: parsed.skipped,
      maxRows: ROSTER_CSV_MAX_ROWS,
    });
  } catch (err) {
    console.error("[api/admin/roster-csv]", err);
    return NextResponse.json(
      { error: "Internal Error", message: "Roster import failed." },
      { status: 500 },
    );
  }
}
