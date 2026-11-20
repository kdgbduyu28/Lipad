import { Platform } from 'react-native';
import { toCalendar } from './normalise';
import { samplePopular, sampleFares } from './sample';
import type { CalendarResponse, FaresResponse, SearchQuery } from './types';
import type { Partners } from './booking';

/**
 * Talks to Lipad's own /api functions. The web app uses the same origin; the
 * phone app uses the deployed site. If the API can't be reached (local dev
 * without functions, offline), it falls back to the same labeled sample data
 * the server would give.
 */
const BASE = Platform.OS === 'web' ? '' : (process.env.EXPO_PUBLIC_API_BASE ?? 'https://lipad.pages.dev');

async function get<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const res = await fetch(`${BASE}${path}?${q.toString()}`, { headers: { accept: 'application/json' } });
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || !type.includes('json')) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

const now = () => new Date().toISOString();

export async function fetchFares(q: SearchQuery): Promise<FaresResponse> {
  try {
    return await get<FaresResponse>('/api/fares', { from: q.from, to: q.to, depart: q.depart, ret: q.ret, direct: q.directOnly ? '1' : undefined });
  } catch {
    return { fares: sampleFares({ from: q.from, to: q.to, depart: q.depart, ret: q.ret, directOnly: q.directOnly }), sample: true, checkedAt: now() };
  }
}

export async function fetchCalendar(from: string, to: string, month: string, directOnly?: boolean): Promise<CalendarResponse> {
  try {
    return await get<CalendarResponse>('/api/calendar', { from, to, month, direct: directOnly ? '1' : undefined });
  } catch {
    return { days: toCalendar(sampleFares({ from, to, depart: month, directOnly })), sample: true, checkedAt: now() };
  }
}

export async function fetchPopular(from: string, month: string): Promise<FaresResponse> {
  try {
    return await get<FaresResponse>('/api/popular', { from, month });
  } catch {
    return { fares: samplePopular(from, month), sample: true, checkedAt: now() };
  }
}

let partners: Promise<Partners> | null = null;

export function fetchPartners(): Promise<Partners> {
  partners ??= get<{ marker: string; tripProgram: string }>('/api/config', {})
    .then((c) => ({ marker: c.marker || undefined, tripProgram: c.tripProgram || undefined }))
    .catch(() => ({}));
  return partners;
}
