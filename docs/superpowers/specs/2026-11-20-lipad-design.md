# Lipad — design

*Working name: "Lipad" (Filipino: to fly). Claude's call, easy to change.*

## Intent and why

A flight search and price-compare app for Filipino travelers, in the spirit of
Skyscanner / CheapOair, plus a **trip budget planner** on top: a step-by-step
setup (like Gawain's meal planner setup, `gawain/src/app/meals/setup.tsx`) that
asks budget, dates, travelers and origin, then shows trips that fit.

It serves two purposes at once (user said "yes" to both):

1. **Portfolio showcase** — sits next to Presyo, Upa, Pabili on the portfolio site.
2. **Real use** — real prices; "Book" links are affiliate links, so bookings can
   earn commission.

Hard rule from the user: **free, public APIs only.**

## Goals

- **Flight search:** from / to (airport or city autocomplete), one-way or round
  trip, exact dates or "any day this month", travelers count (adults/kids/infants).
- **Results:** list of fares with airline, stops, duration (when the source has
  it), price in ₱, and how old the price is ("checked 3 hours ago"). Sort by
  cheapest / fastest / fewest stops; filter by stops and airline.
- **Price calendar:** a month grid showing the cheapest fare per day for a route,
  so users can spot the cheap dates.
- **Book (user decided):** like Skyscanner / CheapOair, "Book" opens a sheet of
  real places to buy, not another comparison site:
  - **The airline's own website** (Cebu Pacific, PAL, AirAsia, etc.): a
    pre-filled search where the airline's URL format allows it, otherwise its
    booking page. No commission, but users trust it.
  - **Trip.com** and other OTAs available as Travelpayouts partner programs:
    affiliate links once the user is approved for each program; plain links
    until then.
  - **Aviasales** kept only as the last fallback.

  Honest limit: Lipad has one cached price per fare, not a live price from every
  site, so the sheet shows "from ₱X (checked 2h ago)" once and "check price" on
  each site. A per-site price comparison needs a live API (later, if Lipad grows).
  Each airline's link format lives in one config file, so it's easy to fix when
  airlines change their sites. Lipad never takes payment.
  **User to do:** apply to Trip.com (and any other wanted programs) inside
  Travelpayouts.
- **Trip budget planner** (the extra feature), a wizard:
  1. Where from (default: nearest PH airport by region choice, e.g. MNL/CEB/DVO/CRK)
  2. Budget for the whole trip, in ₱
  3. When: specific dates, a month, or "next long weekend" (PH holidays)
  4. Who's going (adults / kids)
  5. Domestic, international, or either
  6. Trip length (nights)
  7. Travel style: tipid / sakto / sulit (budget / mid / comfort)

  → **Result:** destinations that fit the budget, ranked by how much is left over.
  Each card shows: cheapest flight total for the group, estimated daily spending ×
  nights, the total vs budget, destination weather for those dates, and a
  "See flights" button that opens the normal search pre-filled.
- **Deals on home:** "Cheapest from MNL this month" and similar, using the same
  backend (popular directions from the user's origin).
- English + Filipino, dark mode, desktop/tablet layout, PWA — same as the other
  apps.
- Saved searches and simple price-watch on the device (local storage only).

## Non-goals (v1)

- Real booking, payment, tickets, refunds.
- User accounts or cloud sync.
- Hotels and car rental. *(Can come later if a free source holds up.)*
- Native APK in v1. Web first; the existing APK release workflow can be added later.

## Anti-goals (would be a failure even if it works)

- Presenting cached prices as exact, guaranteed fares. Every price must say how
  old it is and that the final price is on the booking site.
- Scraping Skyscanner, airline sites or any site that forbids it.
- Exposing the Travelpayouts token in the browser bundle.
- Copying Skyscanner's or CheapOair's name, branding or look. Own design.

## Constraints

- **Free only.** Cloudflare Pages + Pages Functions free tier; Travelpayouts
  free account.
- **The user creates the Travelpayouts account** and supplies the token +
  marker (affiliate ID). Claude can't create accounts. Until then, the backend
  returns clearly labeled sample data so the UI can be built.
- Travelpayouts Data API prices are **cached by them** (hours to days old) and
  only cover routes someone has searched recently. Empty results must be handled
  gracefully ("No recent prices for this route — try nearby dates or airports").
- Follows the user's standing rule: no builds/typecheck/tests during
  development; verify when the user asks.
- Deploy target: Cloudflare Pages (new project, e.g. `lipad.pages.dev` if free —
  check the name isn't taken by someone else, as happened with gawain.pages.dev).

## Approaches considered

| | How | Trade-off |
|---|---|---|
| **A. On-demand backend** ✅ picked | App → Cloudflare Pages Function → Travelpayouts; function caches responses (Cloudflare Cache API, ~1–3 h) | Any route, any month; token hidden. One small server piece, free on Cloudflare. |
| B. Scheduled static JSON (Presyo-style) | GitHub Actions fetches popular PH routes twice a day into JSON | No backend, fast — but only pre-picked routes; can't search arbitrary routes, which the planner needs. |
| C. Both | Static deals + on-demand search | Fastest home screen, two moving parts for little gain. |

User picked **A** ("fetch on search").

## Decided how

- **App:** Expo SDK 57 + expo-router, React Native Web (same stack as Pabili /
  Gawain), TypeScript, Zustand store like Gawain's `src/store`.
- **Backend:** Cloudflare Pages Functions in `functions/api/*` (Gawain already
  has a `functions/` folder to copy patterns from). Secrets: `TP_TOKEN`,
  `TP_MARKER` as Pages environment secrets.
- **Free data sources:**
  - **Flights:** Travelpayouts / Aviasales Data API — prices for dates, month
    calendar, latest prices, popular directions from a city.
  - **Airports, cities, airlines:** Travelpayouts free data files
    (`api.travelpayouts.com/data/...`), bundled or cached; OurAirports as fallback.
  - **Currency:** Frankfurter (ECB rates, free, no key) to show foreign-currency
    spending in ₱.
  - **Weather:** Open-Meteo (free, no key) — forecast for near dates, climate
    averages for far ones.
  - **PH holidays / long weekends:** reuse Gawain's `src/lib/meals/phcalendar.ts`.
- **Daily spending estimates:** no free reliable API exists, so a hand-written
  table in the repo for ~40 popular destinations (PH domestic + Asia), per-person
  per-day ₱ for tipid / sakto / sulit, with a source note and "estimate" label.
  *(Claude's call.)*
- **Group fares:** Data API prices are for one adult. Kids are counted at the
  adult fare (PH low-cost carriers charge kids close to full fare), infants at
  ~10% of the adult fare, and the total is labeled "estimate". Real child/infant
  counts are passed to the booking link. *(Claude's call.)*
- **SEO route pages:** Expo Router static rendering
  pre-builds pages for popular routes (e.g. `/flights/mnl-nrt`) so search
  engines can index them; live prices load on the page.
- **Portfolio:** adding Lipad to the portfolio site is a later, separate step,
  not part of this plan. *(Claude's call.)*
- **Planner ranking:** fits = flight total + daily × nights × people ≤ budget;
  sort by leftover money, then by weather. Destinations not in the spending table
  show flights only.

## Screens (sketch)

```
Home            Search results        Planner (wizard)     Planner result
┌──────────┐    ┌──────────────┐     ┌──────────────┐      ┌──────────────┐
│ From MNL │    │ MNL → NRT    │     │ Step 2 of 7  │      │ ₱20,000 · 2  │
│ To  ...  │    │ Mar 14–19    │     │ Budget?      │      │ Cebu   ₱6.2k │
│ [Search] │    │ ₱8,450 · 1st │     │  ₱ 20,000    │      │  left ₱13.8k │
│──────────│    │ checked 2h   │     │ [Back][Next] │      │ Seoul ₱18.9k │
│ Plan a   │    │ ₱9,100 ...   │     └──────────────┘      │  left ₱1.1k  │
│ trip ▶   │    │ [Calendar]   │                           └──────────────┘
│ Deals    │    └──────────────┘
└──────────┘
```

Tabs: **Search**, **Plan**, **Saved**, **Settings**.

## Left to the builder

- Exact Travelpayouts endpoint choice per screen, response mapping, and cache TTLs.
- Whether airport data is bundled at build time or fetched and cached.
- Visual design (own look, consistent with the user's other apps' quality).
- Folder layout, tests, and the sample-data shape used before the token exists.
- Repo creation (`kdgbduyu28/Lipad`) and first deploy happen only when the user asks.
