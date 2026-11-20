import rows from '../data/places.json';
import countries from '../data/countries.json';

export type Place = {
  code: string;
  name: string;
  cityCode: string;
  country: string;
  lat: number;
  lon: number;
  kind: 'city' | 'airport';
};

type Row = [string, string, string, string, number, number, 'c' | 'a'];

/** The names people actually search for. */
const NICK: Record<string, string> = {
  MPH: 'Boracay (Caticlan)',
  KLO: 'Kalibo (Boracay)',
  IAO: 'Siargao',
  USU: 'Coron (Busuanga)',
  CRK: 'Clark',
  TAG: 'Bohol (Panglao)',
  CEB: 'Cebu',
  DVO: 'Davao',
  CGY: 'Cagayan de Oro',
  DPS: 'Bali (Denpasar)',
  ENI: 'El Nido',
};

export const PLACES: Place[] = (rows as Row[]).map(([code, name, cityCode, country, lat, lon, k]) => ({
  code,
  name: NICK[code] ?? name,
  cityCode,
  country,
  lat,
  lon,
  kind: k === 'c' ? 'city' : 'airport',
}));

const BY_CODE = new Map(PLACES.map((p) => [p.code, p]));
const COUNTRY = countries as Record<string, string>;

export const place = (code: string): Place | undefined => BY_CODE.get(code.toUpperCase());

/** City name for a city or airport code; falls back to the code itself. */
export function cityName(code: string): string {
  const p = place(code);
  if (!p) return code;
  return p.kind === 'city' ? p.name : (place(p.cityCode)?.name ?? p.name);
}

export const countryName = (cc: string) => COUNTRY[cc] ?? cc;
export const isDomestic = (a: string, b: string) => place(a)?.country === 'PH' && place(b)?.country === 'PH';

/** Philippine airports people search from most, in order. */
export const PH_HOMES = ['MNL', 'CEB', 'DVO', 'CRK', 'ILO', 'BCD', 'KLO', 'PPS', 'TAG', 'CGY', 'ZAM', 'GES'];

// The busiest places get a small boost so "Tok" finds Tokyo before Tokat.
const POPULAR = new Set([
  ...PH_HOMES,
  'MPH', 'USU', 'TAC', 'LGP', 'IAO', 'SJI', 'TUG', 'VRC', 'BXU', 'OZC', 'DGT', 'RXS',
  'TYO', 'OSA', 'SEL', 'PUS', 'HKG', 'MFM', 'TPE', 'SIN', 'BKK', 'HKT', 'KUL', 'SGN', 'HAN', 'DAD', 'DPS', 'JKT',
  'SYD', 'MEL', 'DXB', 'DOH', 'LON', 'LAX', 'SFO', 'NYC', 'YVR', 'YTO', 'FUK', 'SPK', 'OKA', 'NGO', 'CJU', 'PNH', 'REP',
]);

/** Places matching typed text: code first, then name prefix, then name contains. */
export function searchPlaces(text: string, limit = 8): Place[] {
  const q = text.trim().toLowerCase();
  if (!q) return [];
  const scored: { p: Place; s: number }[] = [];
  for (const p of PLACES) {
    const name = p.name.toLowerCase();
    const country = (COUNTRY[p.country] ?? '').toLowerCase();
    let s = 0;
    if (p.code.toLowerCase() === q) s = 100;
    else if (name.startsWith(q)) s = 60;
    else if (name.split(/[\s-]/).some((w) => w.startsWith(q))) s = 40;
    else if (q.length >= 4 && country.startsWith(q)) s = 15;
    if (!s) continue;
    if (POPULAR.has(p.code) || POPULAR.has(p.cityCode)) s += 25;
    if (p.kind === 'city') s += 5;
    scored.push({ p, s });
  }
  return scored.sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name)).slice(0, limit).map((x) => x.p);
}

/** Great-circle distance in km between two codes, or undefined if unknown. */
export function distanceKm(a: string, b: string): number | undefined {
  const p = place(a);
  const q = place(b);
  if (!p || !q) return undefined;
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(q.lat - p.lat);
  const dLon = rad(q.lon - p.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(p.lat)) * Math.cos(rad(q.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "Manila (MNL)" style label. */
export const placeLabel = (code: string) => `${cityName(code)} (${code})`;
