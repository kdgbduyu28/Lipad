import type { Fare, Pax } from './types';

/**
 * Where "Book" can send someone. Lipad never sells tickets itself; every option
 * opens a real site where the final price is shown.
 */

export type BookKind = 'airline' | 'ota' | 'meta';
export type BookOption = { kind: BookKind; name: string; url: string; note: string; affiliate: boolean };

/** Airline booking pages. Codes not listed fall through to the travel sites. */
export const AIRLINES: Record<string, { name: string; url: string }> = {
  '5J': { name: 'Cebu Pacific', url: 'https://www.cebupacificair.com/' },
  DG: { name: 'Cebgo', url: 'https://www.cebupacificair.com/' },
  PR: { name: 'Philippine Airlines', url: 'https://www.philippineairlines.com/' },
  '2P': { name: 'PAL Express', url: 'https://www.philippineairlines.com/' },
  Z2: { name: 'AirAsia Philippines', url: 'https://www.airasia.com/' },
  AK: { name: 'AirAsia', url: 'https://www.airasia.com/' },
  D7: { name: 'AirAsia X', url: 'https://www.airasia.com/' },
  FD: { name: 'Thai AirAsia', url: 'https://www.airasia.com/' },
  JL: { name: 'Japan Airlines', url: 'https://www.jal.co.jp/ph/en/' },
  NH: { name: 'ANA', url: 'https://www.ana.co.jp/en/ph/' },
  MM: { name: 'Peach', url: 'https://www.flypeach.com/en' },
  KE: { name: 'Korean Air', url: 'https://www.koreanair.com/' },
  OZ: { name: 'Asiana Airlines', url: 'https://flyasiana.com/' },
  '7C': { name: 'Jeju Air', url: 'https://www.jejuair.net/en/' },
  LJ: { name: 'Jin Air', url: 'https://www.jinair.com/' },
  CX: { name: 'Cathay Pacific', url: 'https://www.cathaypacific.com/' },
  UO: { name: 'HK Express', url: 'https://www.hkexpress.com/' },
  CI: { name: 'China Airlines', url: 'https://www.china-airlines.com/' },
  BR: { name: 'EVA Air', url: 'https://www.evaair.com/' },
  SQ: { name: 'Singapore Airlines', url: 'https://www.singaporeair.com/' },
  TR: { name: 'Scoot', url: 'https://www.flyscoot.com/' },
  TG: { name: 'Thai Airways', url: 'https://www.thaiairways.com/' },
  MH: { name: 'Malaysia Airlines', url: 'https://www.malaysiaairlines.com/' },
  VN: { name: 'Vietnam Airlines', url: 'https://www.vietnamairlines.com/' },
  VJ: { name: 'VietJet', url: 'https://www.vietjetair.com/' },
  GA: { name: 'Garuda Indonesia', url: 'https://www.garuda-indonesia.com/' },
  EK: { name: 'Emirates', url: 'https://www.emirates.com/ph/english/' },
  QR: { name: 'Qatar Airways', url: 'https://www.qatarairways.com/' },
  EY: { name: 'Etihad', url: 'https://www.etihad.com/' },
  QF: { name: 'Qantas', url: 'https://www.qantas.com/' },
  JQ: { name: 'Jetstar', url: 'https://www.jetstar.com/' },
  '3K': { name: 'Jetstar Asia', url: 'https://www.jetstar.com/' },
  UA: { name: 'United', url: 'https://www.united.com/' },
  DL: { name: 'Delta', url: 'https://www.delta.com/' },
  AC: { name: 'Air Canada', url: 'https://www.aircanada.com/' },
  BA: { name: 'British Airways', url: 'https://www.britishairways.com/' },
  NX: { name: 'Air Macau', url: 'https://www.airmacau.com.mo/' },
  MU: { name: 'China Eastern', url: 'https://us.ceair.com/' },
  CZ: { name: 'China Southern', url: 'https://www.csair.com/' },
  K6: { name: 'Cambodia Angkor Air', url: 'https://www.cambodiaangkorair.com/' },
};

export type Partners = { marker?: string; tripProgram?: string };

const ddmm = (iso: string) => `${iso.slice(8, 10)}${iso.slice(5, 7)}`;

/** Wrap a partner URL in a Travelpayouts tracking redirect when we're approved for it. */
function track(url: string, p: Partners, program?: string): { url: string; affiliate: boolean } {
  if (!p.marker || !program) return { url, affiliate: false };
  return { url: `https://tp.media/r?marker=${encodeURIComponent(p.marker)}&p=${encodeURIComponent(program)}&u=${encodeURIComponent(url)}`, affiliate: true };
}

export function tripUrl(f: Fare, pax: Pax): string {
  const q = new URLSearchParams({
    dcity: f.from.toLowerCase(),
    acity: f.to.toLowerCase(),
    ddate: f.departAt.slice(0, 10),
    triptype: f.returnAt ? 'rt' : 'ow',
    class: 'y',
    quantity: String(pax.adults),
    childqty: String(pax.kids),
    babyqty: String(pax.infants),
    locale: 'en-PH',
    curr: 'PHP',
  });
  if (f.returnAt) q.set('rdate', f.returnAt.slice(0, 10));
  return `https://www.trip.com/flights/showfarefirst?${q.toString()}`;
}

export function aviasalesUrl(f: Fare, pax: Pax, marker?: string): string {
  const people = `${pax.adults}${pax.kids || pax.infants ? `${pax.kids}${pax.infants}` : ''}`;
  // The API's own link carries the exact itinerary; only reuse it for the default group.
  const path =
    f.link && pax.adults === 1 && !pax.kids && !pax.infants
      ? f.link
      : `/search/${f.from}${ddmm(f.departAt)}${f.to}${f.returnAt ? ddmm(f.returnAt) : ''}${people}`;
  const url = `https://www.aviasales.com${path.startsWith('/') ? path : `/${path}`}`;
  return marker ? `${url}${url.includes('?') ? '&' : '?'}marker=${encodeURIComponent(marker)}` : url;
}

/** The book sheet, in order: the airline, then Trip.com, then Aviasales as the last fallback. */
export function bookingOptions(f: Fare, pax: Pax, partners: Partners = {}): BookOption[] {
  const out: BookOption[] = [];
  const airline = AIRLINES[f.airline];
  if (airline) {
    out.push({ kind: 'airline', name: airline.name, url: airline.url, note: 'Book direct with the airline', affiliate: false });
  }
  const trip = track(tripUrl(f, pax), partners, partners.tripProgram);
  out.push({ kind: 'ota', name: 'Trip.com', url: trip.url, note: 'Travel site, pay in pesos', affiliate: trip.affiliate });
  out.push({ kind: 'meta', name: 'Aviasales', url: aviasalesUrl(f, pax, partners.marker), note: 'Compares more booking sites', affiliate: !!partners.marker });
  return out;
}

export const airlineName = (code: string, fallback?: Record<string, string>) => AIRLINES[code]?.name ?? fallback?.[code] ?? code;

/** Airline logo from Travelpayouts' free image host. */
export const airlineLogo = (code: string, size = 64) => `https://pics.avs.io/${size}/${size}/${code}.png`;
