/**
 * GET /api/fares?from=MNL&to=TYO&depart=2026-03[-14]&ret=2026-03[-19]&direct=1
 * → FaresResponse: cheapest fares Aviasales users found recently, one adult, PHP.
 */
import { normaliseFares } from '../../src/lib/normalise';
import { sampleFares } from '../../src/lib/sample';
import type { FaresResponse } from '../../src/lib/types';
import { CODE, Ctx, dateParam, json, live, now, param, tp } from './_tp';

export async function onRequestGet(ctx: Ctx): Promise<Response> {
  const url = new URL(ctx.request.url);
  const from = param(url, 'from', CODE);
  const to = param(url, 'to', CODE);
  const depart = dateParam(url, 'depart');
  const ret = dateParam(url, 'ret');
  const directOnly = url.searchParams.get('direct') === '1';
  if (!from || !to || !depart) return json({ error: 'Send from, to (3-letter codes) and depart (YYYY-MM or YYYY-MM-DD).' }, 400);
  if (from === to) return json({ error: 'From and to are the same place.' }, 400);

  const sample = (error?: string): Response =>
    json({ fares: sampleFares({ from, to, depart, ret, directOnly }), sample: true, checkedAt: now(), error } satisfies FaresResponse, 200, 600);

  if (!live(ctx.env)) return sample();
  try {
    const data = await tp(ctx, '/aviasales/v3/prices_for_dates', {
      origin: from,
      destination: to,
      departure_at: depart,
      return_at: ret,
      one_way: !ret,
      direct: directOnly,
      sorting: 'price',
      unique: false,
      limit: 30,
      page: 1,
    });
    const fares = normaliseFares(data, { from, to });
    return json({ fares, sample: false, checkedAt: now() } satisfies FaresResponse, 200, 600);
  } catch (e) {
    return sample(e instanceof Error ? e.message : 'Price service unavailable');
  }
}
