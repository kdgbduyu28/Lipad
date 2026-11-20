/**
 * GET /api/popular?from=MNL&month=2026-03
 * → FaresResponse: the cheapest recent fare to each popular destination from a city.
 * Used for the home-screen deals and by the trip planner.
 */
import { normaliseFares } from '../../src/lib/normalise';
import { samplePopular } from '../../src/lib/sample';
import type { FaresResponse } from '../../src/lib/types';
import { CODE, Ctx, MONTH, json, live, now, param, tp } from './_tp';

export async function onRequestGet(ctx: Ctx): Promise<Response> {
  const url = new URL(ctx.request.url);
  const from = param(url, 'from', CODE);
  const month = url.searchParams.get('month') ?? '';
  if (!from) return json({ error: 'Send from (3-letter code).' }, 400);
  const m = MONTH.test(month) ? month : new Date().toISOString().slice(0, 7);

  const sample = (error?: string) => json({ fares: samplePopular(from, m), sample: true, checkedAt: now(), error } satisfies FaresResponse, 200, 600);
  if (!live(ctx.env)) return sample();
  try {
    // Cheapest fares from this city to anywhere for the month, one per destination.
    const data = await tp(ctx, '/aviasales/v3/prices_for_dates', { origin: from, departure_at: m, one_way: true, sorting: 'price', unique: true, limit: 60, page: 1 });
    let fares = normaliseFares(data, { from });
    if (!fares.length) fares = normaliseFares(await tp(ctx, '/v1/city-directions', { origin: from }), { from });
    const seen = new Set<string>();
    fares = fares.filter((f) => f.to !== from && !seen.has(f.to) && seen.add(f.to)).sort((a, b) => a.price - b.price);
    return json({ fares, sample: false, checkedAt: now() } satisfies FaresResponse, 200, 600);
  } catch (e) {
    return sample(e instanceof Error ? e.message : 'Price service unavailable');
  }
}
