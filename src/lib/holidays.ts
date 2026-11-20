/**
 * Philippine holidays and the long weekends they make, on YYYY-MM-DD strings.
 * Same list as Gawain's calendar (the law's fixed dates plus Holy Week and
 * Chinese New Year). Holidays a proclamation moves, and Eid, aren't known ahead.
 */

export type Holiday = { date: string; name: string };
export type LongWeekend = { start: string; end: string; days: number; name: string };

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
export const shift = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();

function easter(y: number): string {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(y, month - 1, day);
}

const CNY: Record<number, [number, number]> = { 2026: [1, 17], 2027: [1, 6], 2028: [0, 26], 2029: [1, 13], 2030: [1, 3], 2031: [0, 23], 2032: [1, 11] };

function lastMonday(y: number, m: number): string {
  const end = new Date(Date.UTC(y, m + 1, 0));
  end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7));
  return end.toISOString().slice(0, 10);
}

export function holidays(y: number): Holiday[] {
  const e = easter(y);
  const out: Holiday[] = [
    { date: iso(y, 0, 1), name: "New Year's Day" },
    { date: shift(e, -3), name: 'Holy Week' },
    { date: shift(e, -2), name: 'Holy Week' },
    { date: shift(e, -1), name: 'Holy Week' },
    { date: iso(y, 3, 9), name: 'Araw ng Kagitingan' },
    { date: iso(y, 4, 1), name: 'Labor Day' },
    { date: iso(y, 5, 12), name: 'Independence Day' },
    { date: iso(y, 7, 21), name: 'Ninoy Aquino Day' },
    { date: lastMonday(y, 7), name: 'National Heroes Day' },
    { date: iso(y, 10, 1), name: "All Saints' Day" },
    { date: iso(y, 10, 2), name: "All Souls' Day" },
    { date: iso(y, 10, 30), name: 'Bonifacio Day' },
    { date: iso(y, 11, 8), name: 'Immaculate Conception' },
    { date: iso(y, 11, 24), name: 'Christmas' },
    { date: iso(y, 11, 25), name: 'Christmas' },
    { date: iso(y, 11, 30), name: 'Rizal Day' },
    { date: iso(y, 11, 31), name: "New Year's Eve" },
  ];
  const cny = CNY[y];
  if (cny) out.push({ date: iso(y, cny[0], cny[1]), name: 'Chinese New Year' });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Runs of 3+ days off (weekends joined with holidays) starting on or after `from`. */
export function longWeekends(from: string, count = 6): LongWeekend[] {
  const y = Number(from.slice(0, 4));
  const hol = new Map<string, string>();
  for (const h of [...holidays(y), ...holidays(y + 1)]) if (!hol.has(h.date)) hol.set(h.date, h.name);
  const off = (d: string) => hol.has(d) || weekday(d) === 0 || weekday(d) === 6;
  const out: LongWeekend[] = [];
  let d = from;
  const stop = shift(from, 400);
  while (d < stop && out.length < count) {
    if (!off(d)) {
      d = shift(d, 1);
      continue;
    }
    let end = d;
    let name = hol.get(d);
    while (off(shift(end, 1))) {
      end = shift(end, 1);
      name ??= hol.get(end);
    }
    const days = Math.round((Date.parse(end) - Date.parse(d)) / 86400000) + 1;
    if (days >= 3 && name) out.push({ start: d, end, days, name });
    d = shift(end, 1);
  }
  return out;
}
