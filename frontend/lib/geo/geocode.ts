/**
 * Server-side geocode for N3 radius alerts.
 * Uses Nominatim (OpenStreetMap) — fail-soft, no API key required.
 * Respect their usage policy: identify the app in User-Agent.
 */

export type GeoPoint = { lat: number; lng: number };

export async function geocodeLabel(
  query: string,
): Promise<GeoPoint | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "RescueHub/1.0 (animal-rescue; radius alerts)",
      },
      // Nominatim asks for caching; Next fetch cache helps warm paths.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const rows = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const row = rows[0];
    if (!row?.lat || !row?.lon) return null;
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  } catch (err) {
    console.warn("[geo/geocode] failed:", err);
    return null;
  }
}
