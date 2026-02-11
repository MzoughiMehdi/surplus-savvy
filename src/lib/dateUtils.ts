/**
 * Returns today's date in YYYY-MM-DD format using Europe/Paris timezone.
 */
export function getParisDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

/**
 * Returns tomorrow's date in YYYY-MM-DD format using Europe/Paris timezone.
 */
export function getParisTomorrow(): string {
  const d = new Date(getParisDate() + "T12:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * Converts a UTC ISO timestamp to a YYYY-MM-DD date string in Europe/Paris timezone.
 */
export function toParisDateString(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}
