// Builds src/data/places.json from Travelpayouts' free data files.
//
//   node scripts/build-places.mjs
//
// Each row: [code, name, cityCode, country, lat, lon, kind]
//   kind: "c" = city (searches all its airports), "a" = airport
// Only places with scheduled flights are kept, so the file stays small.

import { writeFileSync } from 'node:fs';

const BASE = 'https://api.travelpayouts.com/data/en';
const get = async (f) => {
  const res = await fetch(`${BASE}/${f}.json`);
  if (!res.ok) throw new Error(`${f}: ${res.status}`);
  return res.json();
};

const [cities, airports, countries, airlines] = await Promise.all([get('cities'), get('airports'), get('countries'), get('airlines')]);
const round = (n) => Math.round(n * 1000) / 1000;
const name = (x) => x.name_translations?.en || x.name;

const cityRows = cities
  .filter((c) => c.has_flightable_airport && c.code && c.coordinates)
  .map((c) => [c.code, name(c), c.code, c.country_code, round(c.coordinates.lat), round(c.coordinates.lon), 'c']);

// Airports only where they differ from their city code (MNL city = MNL airport, so skip).
const cityCodes = new Set(cityRows.map((r) => r[0]));
const airportRows = airports
  .filter((a) => a.flightable && a.iata_type === 'airport' && a.code && a.coordinates && cityCodes.has(a.city_code) && a.code !== a.city_code)
  .map((a) => [a.code, name(a), a.city_code, a.country_code, round(a.coordinates.lat), round(a.coordinates.lon), 'a']);

const countryNames = Object.fromEntries(countries.map((c) => [c.code, name(c)]));
const airlineNames = Object.fromEntries(airlines.filter((a) => a.code).map((a) => [a.code, name(a)]));

writeFileSync(new URL('../src/data/places.json', import.meta.url), JSON.stringify([...cityRows, ...airportRows]));
writeFileSync(new URL('../src/data/countries.json', import.meta.url), JSON.stringify(countryNames));
writeFileSync(new URL('../src/data/airlines.json', import.meta.url), JSON.stringify(airlineNames));
console.log(`places: ${cityRows.length} cities + ${airportRows.length} airports; ${Object.keys(countryNames).length} countries; ${Object.keys(airlineNames).length} airlines`);
