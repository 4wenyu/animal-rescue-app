import { z } from "zod";

export const DonateBodySchema = z.object({
  rosterId: z.number().int().positive(),
  amount: z.number().positive().max(10_000),
  allocation: z.enum(["medical", "general"]),
});

export type DonateBody = z.infer<typeof DonateBodySchema>;

export function campaignGoal(needsReview: boolean): number {
  return needsReview ? 2500 : 1500;
}
