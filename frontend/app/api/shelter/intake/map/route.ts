import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { PetIntakeBatchSchema } from "@/lib/schemas/intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
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

      // Hard 2-second rate limit safety delay per file
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return NextResponse.json({ animals: extractedAnimals });
  } catch (error: any) {
    console.error("🔥 INTAKE ROUTE CRASHED:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}