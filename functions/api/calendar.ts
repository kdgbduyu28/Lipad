/**
 * GET /api/calendar?from=MNL&to=TYO&month=2026-03&direct=1
 * → CalendarResponse: the cheapest one-way fare for each day of the month.
 */
import { normaliseFares, toCalendar } from '../../src/lib/normalise';
import { sampleFares } from '../../src/lib/sample';
import type { CalendarResponse } from '../../src/lib/types';
import { CODE, Ctx, MONTH, json, live, now, param, tp } from './_tp';

export async function onRequestGet(ctx: Ctx): Promise<Response> {
  const url = new URL(ctx.request.url);
  const from = param(url, 'from', CODE);
  const to = param(url, 'to', CODE);
  const month = url.searchParams.get('month') ?? '';
  const directOnly = url.searchParams.get('direct') === '1';
  if (!from || !to || !MONTH.test(month) || from === to) return json({ error: 'Send from, to and month (YYYY-MM).' }, 400);

  const sample = () => json({ days: toCalendar(sampleFares({ from, to, depart: month, directOnly })), sample: true, checkedAt: now() } satisfies CalendarResponse, 200, 600);
  if (!live(ctx.env)) return sample();
  try {
    const data = await tp(ctx, '/aviasales/v3/grouped_prices', { origin: from, destination: to, departure_at: month, group_by: 'departure_at', direct: directOnly });
    return json({ days: toCalendar(normaliseFares(data, { from, to })), sample: false, checkedAt: now() } satisfies CalendarResponse, 200, 600);
  } catch {
    return sample();
  }
}
