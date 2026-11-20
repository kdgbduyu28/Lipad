import { distanceKm, place } from './places';
import type { Fare } from './types';

/**
 * Made-up but believable fares, used when the server has no Travelpayouts
 * token yet or the API is down. Always shown with a "Sample prices" badge.
 * Deterministic per route and day, so the same search gives the same answer.
 */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rand(seed: string) {
  let x = hash(seed) || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

const PH_CARRIERS = ['5J', 'PR', 'Z2', 'DG'];
const FOREIGN: Record<string, string[]> = {
  JP: ['JL', 'NH', 'MM'], KR: ['KE', 'OZ', '7C', 'LJ'], HK: ['CX', 'UO'], TW: ['CI', 'BR'], SG: ['SQ', 'TR'],
  TH: ['TG', 'FD'], MY: ['MH', 'AK'], VN: ['VN', 'VJ'], ID: ['GA', 'QZ'], AE: ['EK'], QA: ['QR'], AU: ['QF', 'JQ'],
  US: ['PR', 'UA', 'DL'], CA: ['AC', 'PR'], GB: ['BA', 'PR'], MO: ['NX'], CN: ['MU', 'CZ'], KH: ['K6'],
};

function daysIn(month: string): string[] {
  const [y, m] = month.split('-').map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}

/** Rough one-way adult fare in pesos for a route by distance. */
export function baseFare(from: string, to: string): number {
  const km = distanceKm(from, to) ?? 2500;
  const domestic = place(from)?.country === 'PH' && place(to)?.country === 'PH';
  return Math.round(domestic ? 1100 + km * 2.6 : 2600 + km * 2.9);
}

export function sampleFares(opts: { from: string; to: string; depart: string; ret?: string; directOnly?: boolean; limit?: number }): Fare[] {
  const { from, to, depart, ret, directOnly, limit = 12 } = opts;
  const days = depart.length === 7 ? daysIn(depart) : [depart];
  const today = new Date().toISOString().slice(0, 10);
  const base = baseFare(from, to);
  const km = distanceKm(from, to) ?? 2500;
  const cc = place(to)?.country === 'PH' ? place(from)?.country ?? 'PH' : place(to)?.country ?? '';
  const carriers = [...PH_CARRIERS.slice(0, cc === 'PH' ? 4 : km > 3000 ? 2 : 3), ...(FOREIGN[cc] ?? [])];
  const out: Fare[] = [];
  for (const day of days) {
    if (day < today) continue;
    const r = rand(`${from}${to}${day}${ret ?? ''}`);
    const count = days.length === 1 ? 6 : 1;
    for (let i = 0; i < count; i++) {
      const stops = directOnly || km < 2200 ? 0 : r() < 0.55 ? 0 : 1;
      const weekend = [5, 6, 0].includes(new Date(`${day}T00:00:00Z`).getUTCDay());
      let price = base * (0.72 + r() * 0.7) * (weekend ? 1.15 : 1) * (stops ? 0.85 : 1);
      const flyMin = Math.round((km / 780) * 60 + 35);
      let minutes = flyMin + stops * (90 + Math.round(r() * 180));
      let returnAt: string | undefined;
      if (ret) {
        const back = ret.length === 7 ? addDays(day, 4 + Math.floor(r() * 4)) : ret;
        returnAt = `${back}T${hhmm(r)}:00+08:00`;
        price *= 1.8;
        minutes *= 2;
      }
      out.push({
        from,
        to,
        fromAirport: from,
        toAirport: to,
        price: Math.max(999, Math.round(price / 10) * 10),
        airline: carriers[Math.floor(r() * carriers.length)] ?? '5J',
        departAt: `${day}T${hhmm(r)}:00+08:00`,
        returnAt,
        stops,
        returnStops: ret ? stops : undefined,
        minutes,
      });
    }
  }
  return out.sort((a, b) => a.price - b.price).slice(0, days.length === 1 ? limit : 31);
}

function hhmm(r: () => number) {
  const h = 5 + Math.floor(r() * 17);
  const m = [0, 15, 30, 45][Math.floor(r() * 4)];
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Popular destinations from a city, for the "deals" list and the planner. */
export const SAMPLE_DESTINATIONS = [
  'CEB', 'MPH', 'PPS', 'USU', 'DVO', 'TAG', 'IAO', 'BCD', 'ILO', 'LAO',
  'TYO', 'OSA', 'SEL', 'PUS', 'HKG', 'TPE', 'SIN', 'BKK', 'KUL', 'SGN', 'HAN', 'DPS', 'MFM', 'FUK', 'DXB', 'SYD',
];

export function samplePopular(from: string, month: string): Fare[] {
  return SAMPLE_DESTINATIONS.filter((to) => to !== from && place(to))
    .map((to) => sampleFares({ from, to, depart: month })[0])
    .filter((f): f is Fare => !!f)
    .sort((a, b) => a.price - b.price);
}
