import { dayNumber, fromDayNumber, inclusiveDays } from "@/lib/dates";
import { isSchengen } from "@/lib/countries";

export const SCHENGEN_LIMIT = 90;
export const SCHENGEN_WINDOW = 180;
export const SCHENGEN_BUFFER_DAYS = 2;

export type CountedStay = {
  entryDate: string;
  exitDate: string;
  counts: boolean;
};

export type RollingOptions = {
  limit: number;
  windowDays: number;
  bufferDays: number;
  label: string;
};

export type RollingResult = {
  isCompliant: boolean;
  limit: number;
  windowDays: number;
  maxDays: number;
  overstayDays: number;
  bufferBreached: boolean;
  bufferStartsAbove: number;
  criticalDate?: string;
  firstOverstayDate?: string;
  firstBufferDate?: string;
  notes: string[];
  series: { date: string; days: number }[];
  presenceDays: number;
};

function lowerBound(sorted: number[], target: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function upperBound(sorted: number[], target: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function presenceDayNumbers(stays: CountedStay[]): number[] {
  const set = new Set<number>();
  for (const stay of stays) {
    if (!stay.counts) continue;
    if (stay.exitDate < stay.entryDate) continue;
    const start = dayNumber(stay.entryDate);
    const end = dayNumber(stay.exitDate);
    for (let d = start; d <= end; d += 1) set.add(d);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Rolling presence rule. Entry and exit dates are both days of stay.
 * On each presence day D, the count is the number of presence days in
 * [D - (windowDays - 1), D]. Overlapping stays are counted once.
 * Legal compliance is count <= limit. The buffer is a warning only.
 */
export function evaluateRollingWindow(stays: CountedStay[], options: RollingOptions): RollingResult {
  const { limit, windowDays, bufferDays, label } = options;
  const bufferStartsAbove = limit - bufferDays;
  const days = presenceDayNumbers(stays);
  const empty: RollingResult = {
    isCompliant: true,
    limit,
    windowDays,
    maxDays: 0,
    overstayDays: 0,
    bufferBreached: false,
    bufferStartsAbove,
    notes: [`No ${label} days in this plan.`],
    series: [],
    presenceDays: 0,
  };
  if (days.length === 0) return empty;

  let maxDays = 0;
  let critical: number | undefined;
  let firstOver: number | undefined;
  let firstBuffer: number | undefined;

  for (const day of days) {
    const count = upperBound(days, day) - lowerBound(days, day - (windowDays - 1));
    if (count > maxDays) {
      maxDays = count;
      critical = day;
    }
    if (count > limit && firstOver === undefined) firstOver = day;
    if (count > bufferStartsAbove && firstBuffer === undefined) firstBuffer = day;
  }

  const spanStart = days[0];
  const spanEnd = days[days.length - 1];
  const series: { date: string; days: number }[] = [];
  for (let d = spanStart; d <= spanEnd; d += 1) {
    const count = upperBound(days, d) - lowerBound(days, d - (windowDays - 1));
    series.push({ date: fromDayNumber(d), days: count });
  }

  const overstayDays = Math.max(0, maxDays - limit);
  const isCompliant = maxDays <= limit;
  const bufferBreached = maxDays > bufferStartsAbove;
  const notes: string[] = [];

  if (!isCompliant) {
    notes.push(
      `${label} cap of ${limit} days in any ${windowDays}-day window is exceeded by ${overstayDays} day${overstayDays === 1 ? "" : "s"}.`,
    );
    if (firstOver !== undefined) {
      notes.push(`The cap is first broken on ${fromDayNumber(firstOver)}.`);
    }
  } else if (bufferBreached) {
    notes.push(
      `Still within the ${limit}-day ${label} cap, and inside the ${bufferDays}-day safety buffer (above ${bufferStartsAbove}).`,
    );
  } else {
    notes.push(`${label} stay is within the ${limit}-day cap (${maxDays} day${maxDays === 1 ? "" : "s"} at the peak).`);
  }

  return {
    isCompliant,
    limit,
    windowDays,
    maxDays,
    overstayDays,
    bufferBreached,
    bufferStartsAbove,
    criticalDate: critical === undefined ? undefined : fromDayNumber(critical),
    firstOverstayDate: firstOver === undefined ? undefined : fromDayNumber(firstOver),
    firstBufferDate: firstBuffer === undefined ? undefined : fromDayNumber(firstBuffer),
    notes,
    series,
    presenceDays: days.length,
  };
}

export type SchengenLeg = {
  countryCode: string;
  entryDate: string;
  exitDate: string;
};

export function evaluateSchengen(legs: SchengenLeg[]): RollingResult {
  return evaluateRollingWindow(
    legs.map((leg) => ({
      entryDate: leg.entryDate,
      exitDate: leg.exitDate,
      counts: isSchengen(leg.countryCode),
    })),
    {
      limit: SCHENGEN_LIMIT,
      windowDays: SCHENGEN_WINDOW,
      bufferDays: SCHENGEN_BUFFER_DAYS,
      label: "Schengen",
    },
  );
}

export function stayLength(entryDate: string, exitDate: string): number {
  return inclusiveDays(entryDate, exitDate);
}
