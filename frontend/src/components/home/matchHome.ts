import type { Dog } from "./types";

export type Pace = "calm" | "walks" | "trail";
export type Space = "apt" | "house" | "yard";
export type Household = "solo" | "kids" | "pets";

export type MatchAnswers = {
  pace: Pace;
  space: Space;
  household: Household;
};

const SMALL = /french|beagle|dachshund|shih|cocker|poodle|spaniel/i;
const ACTIVE = /husky|boxer|labrador|retriever|shepherd/i;
const FAMILY = /retriever|labrador|beagle|poodle/i;

function energy(dog: Dog): 0 | 1 | 2 {
  if (dog.age >= 7) return 0;
  if (dog.age <= 1 || ACTIVE.test(dog.breed)) return 2;
  return 1;
}

/** Honest fit score — never boosts behavioral-hold animals. */
export function scoreDog(dog: Dog, answers: MatchAnswers): number {
  if (dog.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL") return Number.NEGATIVE_INFINITY;

  const e = energy(dog);
  let score = 0;

  if (answers.pace === "calm") score += e === 0 ? 3 : e === 1 ? 1 : 0;
  if (answers.pace === "walks") score += e === 1 ? 3 : 1;
  if (answers.pace === "trail") score += e === 2 ? 3 : e === 1 ? 1 : 0;

  if (answers.space === "apt") score += SMALL.test(dog.breed) ? 3 : e === 2 ? 0 : 1;
  if (answers.space === "house") score += 2;
  if (answers.space === "yard") score += e === 2 || ACTIVE.test(dog.breed) ? 3 : 1;

  if (answers.household === "kids") {
    score += dog.age >= 2 && FAMILY.test(dog.breed) ? 3 : 1;
  }
  if (answers.household === "solo") {
    score += dog.age >= 5 || SMALL.test(dog.breed) ? 2 : 1;
  }
  if (answers.household === "pets") {
    score += /social|play|people|cuddle/i.test(dog.personality ?? "") ? 2 : 1;
  }

  if (dog.statutoryHoldCleared) score += 1;
  return score;
}

export function matchHome(
  dogs: Dog[],
  answers: MatchAnswers,
  limit = 2,
): Dog[] {
  return [...dogs]
    .filter((d) => d.euthanasia_risk_status !== "IMMEDIATE_BEHAVIORAL")
    .sort((a, b) => scoreDog(b, answers) - scoreDog(a, answers))
    .slice(0, limit);
}
