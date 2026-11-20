# Lipad

Cheap flights from the Philippines, and trips that fit your budget.

Lipad is a flight search and price-compare web app for Filipino travelers, with a
trip budget planner on top: tell it your budget, dates, who's going and where
from, and it shows destinations that fit, flights and spending money included.

Web first (Expo + React Native Web), with the same code ready for Android/iOS later.

## Features

- **Flight search:** one-way or round trip, exact date or "any day this month",
  adults/kids/infants, direct-only. Sort by cheapest, fastest or fewest stops;
  filter by airline.
- **Price calendar:** the cheapest fare for each day of a month.
- **Book:** opens real places to buy: the airline's own site, Trip.com, or
  Aviasales as a fallback. Lipad never takes payment.
- **Trip budget planner:** a 7-step setup (from, budget, month or PH long weekend,
  travelers, domestic/abroad, nights, tipid/sakto/sulit) that ranks destinations
  by money left, with the weather for those dates and the exchange rate.
- **Deals:** cheapest fares from your home airport this month.
- **Saved searches** with a price-change arrow (on this device only).
- **Route pages** pre-built for 40 popular routes (`/flights/mnl-tyo`) so search
  engines can find them.
- English and Filipino, light/dark mode, phone to desktop layouts.

Every price shows how old it is, and group totals are labeled estimates.

## Free data sources

| What | Source |
|---|---|
| Fares | [Travelpayouts](https://www.travelpayouts.com/) Aviasales Data API (cached fares travelers found recently) |
| Airports, cities, airlines | Travelpayouts free data files (bundled by `npm run places`) |
| Weather | [Open-Meteo](https://open-meteo.com/) forecast and archive (no key) |
| Exchange rates | [Frankfurter](https://frankfurter.dev/) (ECB rates, no key) |
| PH holidays | Built in (`src/lib/holidays.ts`) |
| Daily spending | Hand-written estimates in `src/data/spending.ts` |

## How it works

```
Expo web app ──▶ /api/* Cloudflare Pages Functions ──▶ Travelpayouts Data API
                 (token stays here, 2 h edge cache)
```

- `functions/api/fares.ts`: fares for a route and date or month
- `functions/api/calendar.ts`: cheapest fare per day of a month
- `functions/api/popular.ts`: cheapest fare to each destination from a city
- `functions/api/config.ts`: the public affiliate marker for booking links

Without a token, every endpoint answers clearly labeled **sample prices**, so the
app works end to end before the account is set up.

## Setup

```bash
npm install
npm run web          # dev server (API falls back to sample prices)
npm test             # logic tests (vitest)
npm run typecheck
./scripts/release.sh # build + deploy to Cloudflare Pages
```

### Turning on live prices

1. Make a free [Travelpayouts](https://www.travelpayouts.com/) account and join the
   Aviasales program.
2. In Cloudflare Pages → **lipad** → Settings → Variables and secrets, add:
   - `TP_TOKEN`: your API token (Travelpayouts → Profile → API token)
   - `TP_MARKER`: your partner marker (affiliate ID)
   - `TP_TRIP_PROGRAM` (optional): the Trip.com program ID, once approved
3. Redeploy.

## License

MIT
