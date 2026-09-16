import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { PetIntakeBatchSchema } from "@/lib/schemas/intake";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { requireRole } from "@/lib/api/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** File caps — bound the AI/vision cost of a single request. */
const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per file
const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5 MB across the batch

export async function POST(req: Request) {
  // Staff-only: this endpoint spends paid Gemini vision credits per file, so
  // it must never be reachable anonymously. The /intake/document-scan page
  // that calls it is already STAFF/ADMIN-gated in proxy.ts.
  const authResult = await requireRole("STAFF", "ADMIN");
  if (!authResult.ok) return authResult.response;

  // AI/cost endpoint — throttle per authenticated user as well as per IP.
  const ip = getClientIp(req);
  const { ok, retryAfterSeconds } = checkRateLimit(
    `intake-map:${authResult.user.id}:${ip}`,
    10,
    60 * 1000,
  );
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files: maximum is ${MAX_FILES} per request.` },
        { status: 413 },
      );
    }

    let totalBytes = 0;
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the ${MAX_FILE_BYTES / (1024 * 1024)} MB size limit.` },
          { status: 413 },
        );
      }
      totalBytes += file.size;
    }
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: `Total upload size exceeds the ${MAX_TOTAL_BYTES / (1024 * 1024)} MB limit.` },
        { status: 413 },
      );
    }

    const extractedAnimals = [];

    // Strict sequential processing loop to safeguard rate limits
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString("base64");

      const result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: PetIntakeBatchSchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all animal intake profile records from this document according to the schema.",
              },
              // AI SDK v6 ImagePart expects data URL (mime baked in),
              // plain base64 string, OR a Uint8Array. Embed the mime type
              // into a data URL so the provider gets correct format hints.
              {
                type: "image" as const,
                image: `data:${file.type || "image/jpeg"};base64,${base64String}`,
              },
            ],
          },
        ],
      });

      if (result.object?.animals) {
        extractedAnimals.push(...result.object.animals);
      }
    }

    return NextResponse.json({ animals: extractedAnimals });
  } catch (error: unknown) {
    // Log server-side; return a generic message — no internal details leak.
    console.error("🔥 INTAKE ROUTE CRASHED:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
