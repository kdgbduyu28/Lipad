import { describe, expect, it } from 'vitest';
import { aviasalesUrl, bookingOptions, tripUrl } from '../src/lib/booking';
import { filterFares, groupTotal, sortFares, validateSearch } from '../src/lib/fares';
import { ago, duration, nightsBetween, peso } from '../src/lib/format';
import { longWeekends } from '../src/lib/holidays';
import { normaliseFare, normaliseFares, toCalendar } from '../src/lib/normalise';
import { cityName, distanceKm, searchPlaces } from '../src/lib/places';
import { dailyFor, planTrips } from '../src/lib/planner';
import { sampleFares, samplePopular } from '../src/lib/sample';
import type { Fare, SearchQuery } from '../src/lib/types';

const fare = (o: Partial<Fare> = {}): Fare => ({
  from: 'MNL', to: 'TYO', fromAirport: 'MNL', toAirport: 'NRT', price: 9000, airline: '5J', departAt: '2027-03-14T06:45:00+08:00', stops: 0, minutes: 270, ...o,
});
const pax1 = { adults: 1, kids: 0, infants: 0 };

describe('normalise', () => {
  it('maps a prices_for_dates row', () => {
    const f = normaliseFare({
      origin: 'MNL', destination: 'TYO', origin_airport: 'MNL', destination_airport: 'NRT', price: 8450.4, airline: '5J', flight_number: 5054,
      departure_at: '2027-03-14T06:45:00+08:00', return_at: '2027-03-19T10:00:00+09:00', transfers: 0, return_transfers: 1, duration: 540, link: '/search/MNL1403TYO19031?t=x',
    });
    expect(f).toMatchObject({ price: 8450, flight: '5J 5054', toAirport: 'NRT', stops: 0, returnStops: 1, minutes: 540, link: '/search/MNL1403TYO19031?t=x' });
  });
  it('drops rows without a price or departure', () => {
    expect(normaliseFare({ origin: 'MNL', destination: 'TYO', price: 0, departure_at: '2027-03-14' })).toBeNull();
    expect(normaliseFare({ origin: 'MNL', destination: 'TYO', price: 100 })).toBeNull();
  });
  it('accepts grouped objects and empty data', () => {
    expect(normaliseFares({ '2027-03-01': { price: 5000, departure_at: '2027-03-01T08:00:00+08:00' } }, { from: 'MNL', to: 'CEB' })).toHaveLength(1);
    expect(normaliseFares([])).toEqual([]);
    expect(normaliseFares(null)).toEqual([]);
  });
  it('keeps the cheapest fare per day for the calendar', () => {
    const days = toCalendar([fare({ price: 9000 }), fare({ price: 7000 }), fare({ departAt: '2027-03-15T06:00:00+08:00', price: 8000 })]);
    expect(days.map((d) => [d.date, d.price])).toEqual([['2027-03-14', 7000], ['2027-03-15', 8000]]);
  });
});

describe('fares', () => {
  it('sorts by price, duration and stops', () => {
    const a = fare({ price: 9000, minutes: 300, stops: 1 });
    const b = fare({ price: 8000, minutes: 500, stops: 0 });
    expect(sortFares([a, b], 'price')[0]).toBe(b);
    expect(sortFares([a, b], 'duration')[0]).toBe(a);
    expect(sortFares([a, b], 'stops')[0]).toBe(b);
  });
  it('filters by stops and airline', () => {
    const list = [fare({ stops: 0, airline: 'PR' }), fare({ stops: 1, airline: '5J' })];
    expect(filterFares(list, { maxStops: 0 })).toHaveLength(1);
    expect(filterFares(list, { airlines: ['5J'] })[0].airline).toBe('5J');
  });
  it('counts kids at the adult fare and infants at 10%', () => {
    expect(groupTotal(10000, { adults: 2, kids: 1, infants: 1 })).toBe(31000);
  });
  it('explains why a search cannot run', () => {
    const q: SearchQuery = { from: 'MNL', to: 'CEB', depart: '2027-03-14', pax: pax1 };
    const today = '2027-01-01';
    expect(validateSearch(q, today)).toBeNull();
    expect(validateSearch({ ...q, to: 'MNL' }, today)).toBe('From and to are the same place.');
    expect(validateSearch({ ...q, ret: '2027-03-01' }, today)).toBe('Return comes before departure.');
    expect(validateSearch({ ...q, depart: '2026-12-01' }, today)).toBe('That departure date has passed.');
    expect(validateSearch({ ...q, pax: { adults: 1, kids: 0, infants: 2 } }, today)).toBe('Each infant needs an adult lap.');
    expect(validateSearch({ ...q, to: 'ZZZ' }, today)).toBe('Pick a place from the list.');
  });
});

describe('booking', () => {
  it('lists the airline, then Trip.com, then Aviasales', () => {
    const opts = bookingOptions(fare(), pax1);
    expect(opts.map((o) => o.name)).toEqual(['Cebu Pacific', 'Trip.com', 'Aviasales']);
    expect(opts.every((o) => !o.affiliate)).toBe(true);
  });
  it('skips the airline when its site is unknown', () => {
    expect(bookingOptions(fare({ airline: 'XX' }), pax1).map((o) => o.kind)).toEqual(['ota', 'meta']);
  });
  it('wraps Trip.com in a tracking link once approved', () => {
    const trip = bookingOptions(fare(), pax1, { marker: '123', tripProgram: '3616' })[1];
    expect(trip.affiliate).toBe(true);
    expect(trip.url.startsWith('https://tp.media/r?marker=123&p=3616&u=https%3A%2F%2Fwww.trip.com')).toBe(true);
  });
  it('builds Trip.com and Aviasales searches', () => {
    const rt = fare({ returnAt: '2027-03-19T10:00:00+09:00' });
    expect(tripUrl(rt, { adults: 2, kids: 1, infants: 0 })).toContain('dcity=mnl&acity=tyo&ddate=2027-03-14&triptype=rt&class=y&quantity=2&childqty=1');
    expect(aviasalesUrl(rt, { adults: 2, kids: 1, infants: 0 }, 'm1')).toBe('https://www.aviasales.com/search/MNL1403TYO1903210?marker=m1');
    expect(aviasalesUrl(fare({ link: '/search/MNL1403TYO1?t=abc' }), pax1, 'm1')).toBe('https://www.aviasales.com/search/MNL1403TYO1?t=abc&marker=m1');
  });
});

describe('planner', () => {
  const input = { from: 'MNL', budget: 20000, depart: '2027-03', nights: 3, pax: { adults: 2, kids: 0, infants: 0 }, scope: 'any' as const, style: 'tipid' as const };
  it('ranks what fits by money left', () => {
    const rows = planTrips(input, [fare({ to: 'CEB', price: 1500 }), fare({ to: 'TYO', price: 9000 }), fare({ to: 'BKK', price: 3000 })]);
    // CEB: flights 1500*2*2=6000, stay 1400*2*3=8400 → 14400, left 5600
    expect(rows[0]).toMatchObject({ to: 'CEB', flights: 6000, stay: 8400, total: 14400, left: 5600, fits: true });
    expect(rows.map((r) => r.to)).toEqual(['CEB']);
  });
  it('shows the closest three when nothing fits', () => {
    const rows = planTrips({ ...input, budget: 1000 }, [fare({ to: 'CEB', price: 1500 }), fare({ to: 'BKK', price: 3000 }), fare({ to: 'TYO', price: 9000 }), fare({ to: 'SEL', price: 9500 })]);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => !r.fits)).toBe(true);
    expect(rows[0].to).toBe('CEB');
  });
  it('respects domestic / international', () => {
    const list = [fare({ to: 'CEB', price: 1500 }), fare({ to: 'BKK', price: 3000 })];
    expect(planTrips({ ...input, budget: 1e6, scope: 'domestic' }, list).map((r) => r.to)).toEqual(['CEB']);
    expect(planTrips({ ...input, budget: 1e6, scope: 'international' }, list).map((r) => r.to)).toEqual(['BKK']);
  });
  it('skips places without a spending estimate', () => {
    expect(dailyFor('ZZZ', 'tipid', pax1)).toBeUndefined();
    expect(planTrips({ ...input, budget: 1e6 }, [fare({ to: 'XYZ' })])).toEqual([]);
  });
});

describe('holidays', () => {
  it('finds Holy Week 2027 as a long weekend', () => {
    const lw = longWeekends('2027-03-20', 2);
    expect(lw[0]).toMatchObject({ start: '2027-03-25', end: '2027-03-28', days: 4, name: 'Holy Week' });
  });
});

describe('places and format', () => {
  it('finds places people type', () => {
    expect(searchPlaces('tok')[0].code).toBe('TYO');
    expect(searchPlaces('bora')[0].code).toBe('MPH');
    expect(searchPlaces('ceb')[0].code).toBe('CEB');
    expect(cityName('NRT')).toBe('Tokyo');
    expect(Math.round(distanceKm('MNL', 'CEB')!)).toBeGreaterThan(500);
  });
  it('formats money and time', () => {
    expect(peso(8450)).toBe('₱8,450');
    expect(duration(270)).toBe('4h 30m');
    expect(ago('2027-01-01T00:00:00Z', Date.parse('2027-01-01T02:00:00Z'))).toBe('2h ago');
    expect(nightsBetween('2027-03-14', '2027-03-19')).toBe(5);
  });
});

describe('sample data', () => {
  it('is deterministic and in the future', () => {
    const a = sampleFares({ from: 'MNL', to: 'CEB', depart: '2099-03-14' });
    expect(a).toEqual(sampleFares({ from: 'MNL', to: 'CEB', depart: '2099-03-14' }));
    expect(a.length).toBeGreaterThan(0);
    expect(a.every((f) => f.price >= 999)).toBe(true);
    expect(samplePopular('MNL', '2099-03').length).toBeGreaterThan(10);
  });
});
