import { describe, expect, it } from "vitest";

import {
  parseRosterCsv,
  ROSTER_CSV_TEMPLATE,
} from "@/lib/services/rosterCsvIngest";

describe("parseRosterCsv", () => {
  it("parses the template", () => {
    const result = parseRosterCsv(ROSTER_CSV_TEMPLATE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      id: 101,
      name: "Maple",
      species: "Dog",
      breed: "Labrador Retriever",
      ageYears: 4,
      sex: "Female",
      holdCleared: true,
    });
  });

  it("rejects missing id/name headers", () => {
    const result = parseRosterCsv("foo,bar\n1,x");
    expect(result.ok).toBe(false);
  });

  it("skips bad ids and duplicates", () => {
    const csv = `id,name
0,Bad
1,Ok
1,Dup
abc,Nope
2,Two`;
    const result = parseRosterCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows.map((r) => r.id)).toEqual([1, 2]);
    expect(result.skipped).toBe(3);
  });
});
