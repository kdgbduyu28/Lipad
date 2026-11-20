import { place } from './places';
import { shift } from './holidays';

/** Weather and money for a destination, from free no-key APIs (Open-Meteo, Frankfurter). */

export type Weather = { kind: 'forecast' | 'lastYear'; high: number; low: number; rainyDays: number; days: number };

const r1 = (n: number) => Math.round(n);
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

/**
 * Forecast when the trip starts within 14 days; otherwise what the weather
 * was on the same dates last year (a fair guide to the season).
 */
export async function weatherFor(code: string, start: string, nights: number, today: string): Promise<Weather | null> {
  const p = place(code);
  if (!p) return null;
  const end = shift(start, Math.max(1, nights));
  const soon = start <= shift(today, 14);
  const base = soon ? 'https://api.open-meteo.com/v1/forecast' : 'https://archive-api.open-meteo.com/v1/archive';
  const s = soon ? start : shift(start, -365);
  const e = soon ? (end <= shift(today, 15) ? end : shift(today, 15)) : shift(end, -365);
  const url = `${base}?latitude=${p.lat}&longitude=${p.lon}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = (await res.json()) as { daily?: { temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[] } };
    const d = j.daily;
    if (!d?.temperature_2m_max?.length) return null;
    const hi = d.temperature_2m_max.filter((x) => x != null);
    const lo = d.temperature_2m_min.filter((x) => x != null);
    return {
      kind: soon ? 'forecast' : 'lastYear',
      high: r1(avg(hi)),
      low: r1(avg(lo)),
      rainyDays: d.precipitation_sum.filter((x) => (x ?? 0) >= 2).length,
      days: hi.length,
    };
  } catch {
    return null;
  }
}

export const CURRENCY: Record<string, string> = {
  JP: 'JPY', KR: 'KRW', HK: 'HKD', MO: 'MOP', TW: 'TWD', SG: 'SGD', TH: 'THB', MY: 'MYR', VN: 'VND', ID: 'IDR',
  KH: 'USD', AE: 'AED', QA: 'QAR', AU: 'AUD', NZ: 'NZD', US: 'USD', CA: 'CAD', GB: 'GBP', CN: 'CNY', IN: 'INR',
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', CH: 'CHF', SA: 'SAR',
};

let rates: { at: number; data: Record<string, number> } | null = null;

/** Pesos per one unit of the destination's money, e.g. JPY → 0.40. Frankfurter has no MOP/VND/QAR/AED, so those are skipped. */
export async function pesoPer(currency: string): Promise<number | null> {
  try {
    if (!rates || Date.now() - rates.at > 6 * 3600_000) {
      const res = await fetch('https://api.frankfurter.dev/v1/latest?base=PHP');
      if (!res.ok) return null;
      const j = (await res.json()) as { rates: Record<string, number> };
      rates = { at: Date.now(), data: j.rates };
    }
    const r = rates.data[currency];
    return r ? 1 / r : null;
  } catch {
    return null;
  }
}
