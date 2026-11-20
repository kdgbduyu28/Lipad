import { getLang, t } from '../i18n';

export const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;

/** "2h ago", "just now", "3d ago". */
export function ago(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (mins < 2) return t('just now');
  if (mins < 60) return t('{n}m ago', { n: mins });
  const h = Math.round(mins / 60);
  if (h < 48) return t('{n}h ago', { n: h });
  return t('{n}d ago', { n: Math.round(h / 24) });
}

export function duration(mins?: number): string {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

const locale = () => (getLang() === 'fil' ? 'fil-PH' : 'en-PH');

/** "Sat, Mar 14" from an ISO date or datetime, read as Philippine time. */
export function day(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00+08:00` : iso);
  return d.toLocaleDateString(locale(), { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
}

/** "06:45" in the departure city's offset as given in the ISO string. */
export function time(iso: string): string {
  const m = /T(\d{2}:\d{2})/.exec(iso);
  return m ? m[1] : '';
}

/** "March 2026" from YYYY-MM. */
export function monthLabel(ym: string): string {
  const d = new Date(`${ym}-15T12:00:00+08:00`);
  return d.toLocaleDateString(locale(), { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' });
}

export const todayPH = (now = Date.now()) => new Date(now + 8 * 3600_000).toISOString().slice(0, 10);

/** The next n months as YYYY-MM, starting with this one. */
export function nextMonths(n: number, now = Date.now()): string[] {
  const [y, m] = todayPH(now).split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return d.toISOString().slice(0, 7);
  });
}

export const nightsBetween = (a: string, b: string) => Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86400000);
