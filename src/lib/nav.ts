import type { SearchQuery } from './types';

/** A search as URL params, so results pages can be shared and reloaded. */
export function toParams(q: SearchQuery): Record<string, string> {
  const p: Record<string, string> = { from: q.from, to: q.to, depart: q.depart, a: String(q.pax.adults) };
  if (q.ret) p.ret = q.ret;
  if (q.pax.kids) p.k = String(q.pax.kids);
  if (q.pax.infants) p.i = String(q.pax.infants);
  if (q.directOnly) p.direct = '1';
  return p;
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const int = (v: string | string[] | undefined, d: number, max = 9) => {
  const n = parseInt(one(v), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : d;
};

export function fromParams(p: Record<string, string | string[] | undefined>): SearchQuery {
  return {
    from: one(p.from).toUpperCase(),
    to: one(p.to).toUpperCase(),
    depart: one(p.depart),
    ret: one(p.ret) || undefined,
    pax: { adults: Math.max(1, int(p.a, 1)), kids: int(p.k, 0), infants: int(p.i, 0) },
    directOnly: one(p.direct) === '1',
  };
}

export const resultsHref = (q: SearchQuery) => ({ pathname: '/results' as const, params: toParams(q) });

/** Route slug for the SEO pages: "mnl-tyo". */
export const routeSlug = (from: string, to: string) => `${from}-${to}`.toLowerCase();
