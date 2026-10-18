const DAY_MS = 86_400_000;

export function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date: ${iso}`);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNumber(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromDayNumber(dayNumber(iso) + days);
}

export function inclusiveDays(entry: string, exit: string): number {
  return dayNumber(exit) - dayNumber(entry) + 1;
}

export function shiftMonths(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const monthIndex = m - 1 + delta;
  const year = y + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(d, last);
  return fromDayNumber(Math.floor(Date.UTC(year, month, day) / DAY_MS));
}

export function formatDay(iso: string, opts?: { withYear?: boolean }): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: opts?.withYear === false ? undefined : "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatShort(iso: string): string {
  return formatDay(iso, { withYear: false });
}
