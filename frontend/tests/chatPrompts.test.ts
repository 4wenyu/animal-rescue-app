import { describe, expect, it } from "vitest";

import { chatSurfaceFromPath, chatSystemPrompt } from "@/lib/chatPrompts";

describe("chat surfaces", () => {
  it("treats adoption routes as adopt, not lost-pet", () => {
    expect(chatSurfaceFromPath("/adopt/1")).toBe("adopt");
    expect(chatSurfaceFromPath("/")).toBe("general");
    expect(chatSurfaceFromPath("/lost-pet-intake")).toBe("lost");
  });

  it("does not tell the adopt prompt that a pet is already missing", () => {
    const adopt = chatSystemPrompt("adopt").toLowerCase();
    const lost = chatSystemPrompt("lost").toLowerCase();
    expect(adopt).toContain("do not assume a pet is missing");
    expect(lost).toContain("pet is missing");
    expect(lost).not.toContain("do not assume a pet is missing");
  });
});
