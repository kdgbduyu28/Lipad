/**
 * Shared helpers for the /api functions: call the Travelpayouts Data API with
 * the secret token, cache answers for two hours, and answer JSON.
 *
 * Secrets (Cloudflare Pages → Settings → Variables and secrets):
 *   TP_TOKEN   Travelpayouts API token (Profile → API token)
 *   TP_MARKER  Travelpayouts partner marker (affiliate ID), used in booking links
 *   TP_TRIP_PROGRAM  Travelpayouts program ID for Trip.com, once approved (optional)
 * Without TP_TOKEN every endpoint answers labeled sample data.
 */

export type Env = { TP_TOKEN?: string; TP_MARKER?: string; TP_TRIP_PROGRAM?: string };
export type Ctx = { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void };

const API = 'https://api.travelpayouts.com';
const TTL = 2 * 60 * 60;

export const json = (body: unknown, status = 200, maxAge = 0) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
    },
  });

export const CODE = /^[A-Z]{3}$/;
export const MONTH = /^\d{4}-\d{2}$/;
export const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function param(url: URL, name: string, re?: RegExp): string | undefined {
  const v = url.searchParams.get(name)?.trim().toUpperCase();
  if (!v) return undefined;
  return !re || re.test(v) ? v : undefined;
}

/** Like param() but keeps case, for dates. */
export const dateParam = (url: URL, name: string) => {
  const v = url.searchParams.get(name)?.trim() ?? '';
  return DAY.test(v) || MONTH.test(v) ? v : undefined;
};

/**
 * GET a Travelpayouts path, cached at the edge for two hours by full URL.
 * Throws on network errors or non-2xx answers so callers can fall back.
 */
export async function tp(ctx: Ctx, path: string, query: Record<string, string | number | boolean | undefined>): Promise<unknown> {
  const url = new URL(path, API);
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  url.searchParams.set('currency', 'php');

  // The cache key never contains the token.
  const key = new Request(`https://lipad-cache.internal${url.pathname}${url.search}`);
  const cache = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default;
  const hit = await cache?.match(key);
  if (hit) return hit.json();

  const res = await fetch(url.toString(), { headers: { 'X-Access-Token': ctx.env.TP_TOKEN ?? '', 'Accept-Encoding': 'gzip' } });
  if (!res.ok) throw new Error(`Travelpayouts answered ${res.status}`);
  const body = (await res.json()) as { success?: boolean; data?: unknown; error?: string };
  if (body.success === false) throw new Error(body.error || 'Travelpayouts error');
  const data = body.data ?? [];
  if (cache) {
    ctx.waitUntil(cache.put(key, new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL}` } })));
  }
  return data;
}

export const live = (env: Env) => !!env.TP_TOKEN;
export const now = () => new Date().toISOString();
