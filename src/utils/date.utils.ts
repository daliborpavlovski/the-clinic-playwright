/**
 * Date utilities for generating valid appointment time slots in tests.
 */

/** Returns an ISO timestamp `offsetHours` hours in the future (rounded to next half-hour). */
export function futureSlot(offsetHours = 25): string {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours, 0, 0, 0);
  // Round to next 30-minute mark
  const minutes = d.getMinutes();
  if (minutes !== 0 && minutes !== 30) {
    d.setMinutes(minutes < 30 ? 30 : 0);
    if (minutes >= 30) d.setHours(d.getHours() + 1);
  }
  return d.toISOString();
}

/** Returns an ISO timestamp `offsetHours` hours in the past. */
export function pastSlot(offsetHours = 48): string {
  const d = new Date();
  d.setHours(d.getHours() - offsetHours, 0, 0, 0);
  return d.toISOString();
}

/**
 * Returns a [start, end] ISO pair for a future appointment slot.
 * @param durationMinutes - defaults to 30
 * @param offsetHours - how many hours from now to start
 */
export function futureSlotPair(
  durationMinutes = 30,
  offsetHours = 25,
): [string, string] {
  const start = new Date(futureSlot(offsetHours));
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return [start.toISOString(), end.toISOString()];
}

/** Format an ISO date for display in assertions (locale-independent). */
export function formatSlot(iso: string): string {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 16);
}

/** Returns ISO string for `n` days from now at a specific hour. */
export function daysFromNow(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
