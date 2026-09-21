/**
 * Pilot roster CSV ingest (N0).
 * Maps shelter exports into `roster-{n}` Animal rows the public feed already reads.
 *
 * Expected header (case-insensitive; extras ignored):
 *   id,name,species,breed,age,sex,personality,imageUrl,holdCleared
 * `id` = positive integer → animalId `roster-{id}`.
 */
export type RosterCsvRow = {
  id: number;
  name: string;
  species: string;
  breed: string;
  ageYears: number | null;
  sex: "Male" | "Female" | null;
  personality: string | null;
  imageUrl: string | null;
  holdCleared: boolean;
};

export type RosterCsvParseResult =
  | { ok: true; rows: RosterCsvRow[]; skipped: number }
  | { ok: false; error: string };

const MAX_ROWS = 100;

const HEADER_ALIASES: Record<string, keyof RosterCsvRow | "age" | "hold"> = {
  id: "id",
  animal_id: "id",
  animalid: "id",
  name: "name",
  species: "species",
  breed: "breed",
  age: "age",
  ageyears: "age",
  age_years: "age",
  sex: "sex",
  gender: "sex",
  personality: "personality",
  description: "personality",
  imageurl: "imageUrl",
  image_url: "imageUrl",
  photo: "imageUrl",
  holdcleared: "hold",
  hold_cleared: "hold",
  statutoryholdcleared: "hold",
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBool(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (!v) return true;
  return v === "true" || v === "1" || v === "yes" || v === "y";
}

function parseSex(raw: string): "Male" | "Female" | null {
  const v = raw.trim().toLowerCase();
  if (v === "male" || v === "m") return "Male";
  if (v === "female" || v === "f") return "Female";
  return null;
}

/** Parse a UTF-8 CSV string into roster rows. */
export function parseRosterCsv(text: string): RosterCsvParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { ok: false, error: "CSV needs a header row and at least one data row." };
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const col: Partial<Record<string, number>> = {};
  for (let i = 0; i < headers.length; i++) {
    const mapped = HEADER_ALIASES[headers[i]];
    if (mapped) col[mapped] = i;
  }

  if (col.id === undefined || col.name === undefined) {
    return {
      ok: false,
      error: "CSV must include id and name columns (see roster CSV template).",
    };
  }

  const rows: RosterCsvRow[] = [];
  let skipped = 0;
  const seen = new Set<number>();

  for (let li = 1; li < lines.length; li++) {
    if (rows.length >= MAX_ROWS) {
      skipped += lines.length - li;
      break;
    }
    const cells = splitCsvLine(lines[li]);
    const idRaw = cells[col.id!] ?? "";
    const id = Number.parseInt(idRaw, 10);
    if (!Number.isInteger(id) || id <= 0) {
      skipped += 1;
      continue;
    }
    if (seen.has(id)) {
      skipped += 1;
      continue;
    }
    const name = (cells[col.name!] ?? "").trim();
    if (!name) {
      skipped += 1;
      continue;
    }
    seen.add(id);

    const ageIdx = col.age;
    let ageYears: number | null = null;
    if (ageIdx !== undefined) {
      const n = Number.parseInt(cells[ageIdx] ?? "", 10);
      if (Number.isInteger(n) && n >= 0 && n <= 40) ageYears = n;
    }

    const cell = (key: string): string => {
      const idx = col[key];
      return idx === undefined ? "" : (cells[idx] ?? "");
    };

    rows.push({
      id,
      name: name.slice(0, 80),
      species: (cell("species").trim() || "Dog").slice(0, 40),
      breed: (cell("breed").trim() || "Mixed Breed").slice(0, 80),
      ageYears,
      sex: parseSex(cell("sex")),
      personality: (() => {
        const p = cell("personality").trim();
        return p ? p.slice(0, 240) : null;
      })(),
      imageUrl: (() => {
        const u = cell("imageUrl").trim();
        return u.startsWith("https://") || u.startsWith("http://")
          ? u.slice(0, 500)
          : null;
      })(),
      holdCleared: parseBool(cell("hold") || "true"),
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "No valid animal rows found in CSV." };
  }

  return { ok: true, rows, skipped };
}

export const ROSTER_CSV_TEMPLATE = `id,name,species,breed,age,sex,personality,imageUrl,holdCleared
101,Maple,Dog,Labrador Retriever,4,Female,Calm and food-motivated.,,true
102,Scout,Dog,Mixed Breed,2,Male,Energetic walker; good with kids.,,true
`;

export { MAX_ROWS as ROSTER_CSV_MAX_ROWS };
