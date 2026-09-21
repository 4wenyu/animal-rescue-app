import { describe, expect, it } from "vitest";

import {
  parseShareEvidence,
  safeHttpUrl,
} from "@/src/components/shares/shareEvidence";

describe("shareEvidence", () => {
  it("parses related ids and source", () => {
    const ev = parseShareEvidence({
      relatedSearchId: "search-1",
      relatedAnimalId: "dog-9",
      source: "radar-share-to-earn",
      extra: 1,
    });
    expect(ev.relatedSearchId).toBe("search-1");
    expect(ev.relatedAnimalId).toBe("dog-9");
    expect(ev.source).toBe("radar-share-to-earn");
    expect(ev.extra).toBe(1);
  });

  it("rejects non-http proof urls", () => {
    expect(safeHttpUrl("https://example.com/post")).toBe(
      "https://example.com/post",
    );
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
});
