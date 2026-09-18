import { z } from "zod";

export const ROSTER_ANIMAL_PREFIX = "roster-";

export function rosterAnimalId(rosterId: number): string {
  return `${ROSTER_ANIMAL_PREFIX}${rosterId}`;
}

export function parseRosterId(value: string): number | null {
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function examMedState(
  needsReview: boolean,
  emergencyCount: number,
): "HEALTHY_HOLD" | "ISOLATION" {
  return emergencyCount > 0 || needsReview ? "ISOLATION" : "HEALTHY_HOLD";
}

const nullableNumber = z
  .number()
  .finite()
  .nullable()
  .catch(null);

const treatment = z.object({
  name: z.string().trim().min(1).max(80),
  administeredAt: z.string().trim().min(1).max(40),
});

export const MedicalLogBodySchema = z.object({
  rosterId: z.number().int().positive(),
  weightLbs: z.number().min(0).max(400).nullable().catch(null),
  tpr: z.object({
    temperatureF: nullableNumber,
    pulse: z.number().int().min(0).max(400).nullable().catch(null),
    respiration: z.number().int().min(0).max(200).nullable().catch(null),
  }),
  microchipScanned: z.boolean(),
  vaccinesAdministered: z.array(treatment).max(20),
  dewormerAdministered: z.array(treatment).max(20),
  emergencySignsNoted: z.array(z.string().trim().min(1).max(80)).max(20),
});

export type MedicalLogBody = z.infer<typeof MedicalLogBodySchema>;
