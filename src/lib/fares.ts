import type { Fare, Pax, SearchQuery } from './types';
import { place } from './places';

export type SortBy = 'price' | 'duration' | 'stops';

export function sortFares(fares: Fare[], by: SortBy): Fare[] {
  const key = (f: Fare): number[] =>
    by === 'price' ? [f.price, f.minutes ?? 1e9] : by === 'duration' ? [f.minutes ?? 1e9, f.price] : [f.stops + (f.returnStops ?? 0), f.price];
  return [...fares].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka[0] - kb[0] || ka[1] - kb[1];
  });
}

export type Filters = { maxStops?: number; airlines?: string[] };

export function filterFares(fares: Fare[], f: Filters): Fare[] {
  return fares.filter((x) => (f.maxStops == null || Math.max(x.stops, x.returnStops ?? 0) <= f.maxStops) && (!f.airlines?.length || f.airlines.includes(x.airline)));
}

/** Infants (under 2, on a lap) usually pay about a tenth of the adult fare. */
export const INFANT_SHARE = 0.1;

/**
 * Estimated total for the group from a one-adult fare. Kids count at the full
 * adult fare (Philippine low-cost carriers charge kids close to full), infants
 * at 10%. Always shown as an estimate.
 */
export function groupTotal(adultFare: number, pax: Pax): number {
  return Math.round(adultFare * (pax.adults + pax.kids) + adultFare * INFANT_SHARE * pax.infants);
}

export const travellers = (p: Pax) => p.adults + p.kids + p.infants;

/** Why a search can't run yet, or null when it can. Returns English; callers translate. */
export function validateSearch(q: SearchQuery, today: string): string | null {
  if (!q.from || !q.to) return 'Pick where you fly from and to.';
  if (!place(q.from) || !place(q.to)) return 'Pick a place from the list.';
  if (q.from === q.to || place(q.from)?.cityCode === place(q.to)?.cityCode) return 'From and to are the same place.';
  if (!q.depart) return 'Pick a departure date or month.';
  if (q.depart.length === 10 && q.depart < today) return 'That departure date has passed.';
  if (q.depart.length === 7 && q.depart < today.slice(0, 7)) return 'That month has passed.';
  if (q.ret && q.ret < q.depart) return 'Return comes before departure.';
  if (q.pax.adults < 1) return 'At least one adult has to fly.';
  if (q.pax.infants > q.pax.adults) return 'Each infant needs an adult lap.';
  if (travellers(q.pax) > 9) return 'Up to 9 travelers per booking.';
  return null;
}

/** Cheapest fare in a list, or undefined. */
export const cheapest = (fares: Fare[]) => fares.reduce<Fare | undefined>((m, f) => (!m || f.price < m.price ? f : m), undefined);

/** Distinct airlines in a list, most common first. */
export function airlinesIn(fares: Fare[]): string[] {
  const n = new Map<string, number>();
  for (const f of fares) if (f.airline) n.set(f.airline, (n.get(f.airline) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a);
}
