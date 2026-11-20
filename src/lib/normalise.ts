import type { CalendarDay, Fare } from './types';

type Raw = Record<string, unknown>;

const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v !== '' && Number.isFinite(+v) ? +v : undefined);

/**
 * Turn one Travelpayouts fare object into a Fare, or null when it lacks the
 * basics (price, route, departure). The API's field names differ slightly
 * between methods, so this accepts the known variants.
 */
export function normaliseFare(r: Raw, fallback: { from?: string; to?: string } = {}): Fare | null {
  const price = num(r.price ?? r.value);
  const from = str(r.origin) ?? fallback.from;
  const to = str(r.destination) ?? fallback.to;
  const departAt = str(r.departure_at) ?? str(r.depart_date);
  if (!price || price <= 0 || !from || !to || !departAt) return null;
  const airline = str(r.airline) ?? '';
  const flightNo = r.flight_number != null ? String(r.flight_number) : '';
  const durTo = num(r.duration_to);
  const durBack = num(r.duration_back);
  const minutes = num(r.duration) ?? (durTo != null ? durTo + (durBack ?? 0) : undefined);
  return {
    from,
    to,
    fromAirport: str(r.origin_airport) ?? from,
    toAirport: str(r.destination_airport) ?? to,
    price: Math.round(price),
    airline,
    flight: airline && flightNo ? `${airline} ${flightNo}` : undefined,
    departAt,
    returnAt: str(r.return_at) ?? str(r.return_date),
    stops: num(r.transfers ?? r.number_of_changes) ?? 0,
    returnStops: num(r.return_transfers),
    minutes: minutes || undefined,
    link: str(r.link),
  };
}

/** Accepts an array, or an object keyed by date/destination (grouped methods). */
export function normaliseFares(data: unknown, fallback: { from?: string; to?: string } = {}): Fare[] {
  const list: Raw[] = Array.isArray(data) ? data : data && typeof data === 'object' ? Object.values(data as Record<string, Raw>) : [];
  const out: Fare[] = [];
  for (const r of list) {
    if (!r || typeof r !== 'object') continue;
    const f = normaliseFare(r as Raw, fallback);
    if (f) out.push(f);
  }
  return out;
}

/** Cheapest fare per departure day, sorted by date. */
export function toCalendar(fares: Fare[]): CalendarDay[] {
  const best = new Map<string, Fare>();
  for (const f of fares) {
    const d = f.departAt.slice(0, 10);
    const cur = best.get(d);
    if (!cur || f.price < cur.price) best.set(d, f);
  }
  return [...best.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, f]) => ({ date, price: f.price, airline: f.airline, stops: f.stops }));
}
