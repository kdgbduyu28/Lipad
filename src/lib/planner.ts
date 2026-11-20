import { KID_SHARE, SPENDING, Style } from '../data/spending';
import { groupTotal } from './fares';
import { place } from './places';
import type { Fare, Pax } from './types';

export type Scope = 'domestic' | 'international' | 'any';

export type PlanInput = {
  from: string;
  budget: number;
  /** YYYY-MM month, or exact start date YYYY-MM-DD. */
  depart: string;
  nights: number;
  pax: Pax;
  scope: Scope;
  style: Style;
};

export type PlanResult = {
  to: string;
  fare: Fare;
  /** Round-trip flights for the whole group (estimate). */
  flights: number;
  /** Stay, food and getting around for all nights (estimate). */
  stay: number;
  total: number;
  /** Budget minus total; negative when it doesn't fit. */
  left: number;
  fits: boolean;
  perDay: number;
  /** True when flights come from a real round-trip fare, not one-way × 2. */
  roundTrip: boolean;
};

/** The dates to check a round trip for: the planned start (or the cheap fare's day) and start + nights. */
export function tripDates(input: Pick<PlanInput, 'depart' | 'nights'>, fare: Fare): { depart: string; ret: string } {
  const depart = input.depart.length === 10 ? input.depart : fare.departAt.slice(0, 10);
  const d = new Date(`${depart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.max(1, input.nights));
  return { depart, ret: d.toISOString().slice(0, 10) };
}

/**
 * Swap in real round-trip fares where we have them: for each destination with
 * a round-trip fare, its one-way fares are dropped and the cheapest round trip
 * is used instead.
 */
export function applyRoundTrips(fares: Fare[], roundTrips: Fare[]): Fare[] {
  const best = new Map<string, Fare>();
  for (const f of roundTrips) {
    if (!f.returnAt) continue;
    const cur = best.get(f.to);
    if (!cur || f.price < cur.price) best.set(f.to, f);
  }
  return [...fares.filter((f) => !best.has(f.to)), ...best.values()];
}

/** Daily spending for the group, or undefined for places without an estimate. */
export function dailyFor(to: string, style: Style, pax: Pax): number | undefined {
  const d = SPENDING[to] ?? SPENDING[place(to)?.cityCode ?? ''];
  if (!d) return undefined;
  return Math.round(d[style] * (pax.adults + pax.kids * KID_SHARE));
}

/**
 * Rank destinations against a budget. `fares` are the cheapest fares from the
 * origin (one per destination). One-way fares are doubled for the trip home;
 * round-trip fares are used as they are. Destinations without a spending
 * estimate are skipped, since we can't say whether they fit.
 *
 * Returns the ones that fit, most money left first. When none fit, returns
 * the closest three, smallest shortfall first, with fits:false.
 */
export function planTrips(input: PlanInput, fares: Fare[]): PlanResult[] {
  const best = new Map<string, Fare>();
  for (const f of fares) {
    const to = f.to;
    // A real round trip always wins over a one-way estimate for the same place.
    const cur0 = best.get(to);
    if (cur0?.returnAt && !f.returnAt) continue;
    if (f.returnAt && cur0 && !cur0.returnAt) best.delete(to);
    if (to === input.from) continue;
    const domestic = place(input.from)?.country === 'PH' && place(to)?.country === 'PH';
    if (input.scope === 'domestic' && !domestic) continue;
    if (input.scope === 'international' && domestic) continue;
    const cur = best.get(to);
    if (!cur || f.price < cur.price) best.set(to, f);
  }
  const rows: PlanResult[] = [];
  for (const [to, fare] of best) {
    const perDay = dailyFor(to, input.style, input.pax);
    if (perDay == null) continue;
    const roundTrip = fare.returnAt ? fare.price : fare.price * 2;
    const flights = groupTotal(roundTrip, input.pax);
    const stay = perDay * Math.max(1, input.nights);
    const total = flights + stay;
    const left = input.budget - total;
    rows.push({ to, fare, flights, stay, total, left, fits: left >= 0, perDay, roundTrip: !!fare.returnAt });
  }
  const fits = rows.filter((r) => r.fits).sort((a, b) => b.left - a.left);
  if (fits.length) return fits;
  return rows.sort((a, b) => b.left - a.left).slice(0, 3);
}
