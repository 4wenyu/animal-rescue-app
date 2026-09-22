/**
 * Normalize a helper's opted-in mobile number to E.164.
 * Blank is valid (clears the number). Junk is not.
 */
export function normalizePhoneE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}
