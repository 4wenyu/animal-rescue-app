import { describe, expect, it } from "vitest";

import {
  OPENING_HOOK_SENTINEL,
  isMeaningfulDraft,
  parseLostPetDraft,
  serializeLostPetDraft,
} from "@/src/components/chat/lostPetDraft";

describe("lost-pet draft persistence", () => {
  it("does not treat a greeting-only transcript as worth saving", () => {
    expect(
      isMeaningfulDraft(
        [{ id: "opening-hook", role: "assistant", content: "Hello" }],
        {},
      ),
    ).toBe(false);
  });

  it("round-trips captured fields and later turns", () => {
    const messages = [
      { id: "opening-hook", role: "assistant" as const, content: "Hi" },
      { id: "u1", role: "user" as const, content: "My dog is missing" },
    ];
    const acc = { species: "dog", lastSeen: { locality: "Austin" } };
    const restored = parseLostPetDraft(serializeLostPetDraft(messages, acc));

    expect(restored?.accumulated.species).toBe("dog");
    expect(restored?.messages).toHaveLength(2);
  });

  it("keeps a user turn even when the greeting is still the placeholder", () => {
    expect(
      isMeaningfulDraft(
        [
          {
            id: "opening-hook",
            role: "assistant",
            content: OPENING_HOOK_SENTINEL,
          },
          { id: "u1", role: "user", content: "My dog is missing" },
        ],
        {},
      ),
    ).toBe(true);
  });

  it("returns null for garbage rather than throwing", () => {
    expect(parseLostPetDraft("not-json")).toBeNull();
    expect(parseLostPetDraft(null)).toBeNull();
  });
});
