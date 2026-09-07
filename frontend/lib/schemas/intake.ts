/**
 * RescueHub AI Intake — extraction schemas
 *
 * Consumed by: app/api/shelter/intake/map/route.ts
 *   generateObject({ schema: PetIntakeBatchSchema, ... })
 *   which then reads result.object.animals and spreads into the response.
 *
 * Mirrors the canonical record shape in frontend/data/dogs.json so values
 * extracted from cage cards / intake sheets can be inserted directly into the
 * adoption feed pipeline.
 *
 * Why a BATCH wrapper (rather than a single PetIntakeSchema)?
 *   A real cage-card image often contains 2–6 animals. The route expects
 *   `result.object.animals` (plural) — one AI call per uploaded image, zero
 *   or many animal records per call. So we choose an array container that
 *   allows zero entries (blank cage card) or many.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Enums — mirror the compliance values already enforced app-wide.    */
/* ------------------------------------------------------------------ */

export const EuthanasiaRiskStatus = z.enum([
  "SAFE",
  "AT_RISK",
  "IMMEDIATE_BEHAVIORAL",
]);
export type EuthanasiaRiskStatus = z.infer<typeof EuthanasiaRiskStatus>;

export const MedicalStatus = z.enum([
  "Healthy",
  "Needs Review",
  "Treatable",
  "Urgent",
  "Untreatable",
]);

export const Species = z.enum([
  "dog",
  "cat",
  "rabbit",
  "turtle",
  "bird",
  "small_mammal",
  "reptile",
  "fish",
  "other",
]);

/* ------------------------------------------------------------------ */
/* Single animal record — extracted per animal from a cage card.      */
/* ------------------------------------------------------------------ */

export const PetIntakeSchema = z
  .object({
    name: z
      .string()
      .nullable()
      .optional()
      .describe(
        "Name printed on the cage card. May be blank/null for unnamed intakes."
      ),

    species: Species.nullable()
      .optional()
      .describe(
        "Animal species. Must be one of: dog, cat, rabbit, other. If unreadable, omit or set null."
      ),

    breed: z
      .string()
      .nullable()
      .optional()
      .describe("Best-guess breed string as printed on the cage card."),

    age: z
      .number()
      .int()
      .min(0)
      .max(40)
      .nullable()
      .optional()
      .describe("Age in whole years. Estimate from 'Y' / 'yr' if needed."),

    sex: z
      .enum(["male", "female", "unknown"])
      .nullable()
      .optional()
      .describe("Sex marker printed on the card (M/F/spayed/neutered)."),

    weightLbs: z
      .number()
      .min(0)
      .max(300)
      .nullable()
      .optional()
      .describe("Bodyweight in pounds if listed on the card."),

    medicalStatus: MedicalStatus.nullable()
      .optional()
      .describe(
        "Medical disposition shorthand. 'Healthy' = routine; 'Needs Review' = vet must triage; 'Urgent' = immediate care; 'Treatable' = treat then adopt; 'Untreatable' = humane euthanasia list candidate (must trigger IRC § 513 review)."
      ),

    euthanasia_risk_status: EuthanasiaRiskStatus.nullable()
      .optional()
      .describe(
        "Compliance-critical field. SAFE = adopted/scheduled path; AT_RISK = approaching statutory deadline; IMMEDIATE_BEHAVIORAL = behavior disqualification flag (must NOT appear in public adoption feed; only staff RBAC context)."
      ),

    statutoryHoldCleared: z
      .boolean()
      .nullable()
      .optional()
      .describe(
        "True if legal stray-hold period has been served (state-mandated waiting period before adoption). False otherwise."
      ),

    intakeTimestamp: z
      .string()
      .nullable()
      .optional()
      .describe(
        "ISO-8601 timestamp of intake (e.g. 2026-06-09T10:00:00Z). Leave null if not printed on the card."
      ),

    intakeNumber: z
      .string()
      .nullable()
      .optional()
      .describe("Shelter-side intake / animal ID number printed on the card."),

    notes: z
      .string()
      .nullable()
      .optional()
      .describe(
        "Free-text handwritten notes, behavior warnings, owner-surrender reason, etc. Long-form."
      ),
  })
  .describe(
    "One rescued/animal record extracted from a shelter cage card or intake sheet image."
  );

export type PetIntake = z.infer<typeof PetIntakeSchema>;

/* ------------------------------------------------------------------ */
/* Batch wrapper — what the route actually consumes                  */
/* ------------------------------------------------------------------ */

export const PetIntakeBatchSchema = z
  .object({
    animals: z
      .array(PetIntakeSchema)
      .min(0)
      .describe(
        "Zero or more animal records extracted from this uploaded image. Zero is valid (blank or unreadable card); many is valid (multi-cage row)."
      ),
    // Tier 0.4: server decides stray-hold semantics from the submission type.
    // PUBLIC_STRAY (default) = found animal → hold computed from intake time;
    // OWNER_SURRENDER = legal owner surrenders custody → no stray hold applies.
    // A client-supplied per-animal `statutoryHoldCleared` boolean is NEVER
    // trusted — it would let anyone clear a legal hold.
    intakeType: z
      .enum(["PUBLIC_STRAY", "OWNER_SURRENDER"])
      .optional()
      .default("PUBLIC_STRAY"),
  })
  .describe(
    "AI extraction response wrapper: a single batch of PetIntake records corresponding to one uploaded image."
  );

export type PetIntakeBatch = z.infer<typeof PetIntakeBatchSchema>;
