/** One fare as the app sees it, for one adult, in pesos. */
export type Fare = {
  from: string; // city code (MNL)
  to: string;
  fromAirport: string; // airport code (MNL / CRK)
  toAirport: string;
  price: number;
  airline: string; // IATA code (5J)
  flight?: string; // "5J 5054"
  departAt: string; // ISO
  returnAt?: string; // ISO, round trips only
  stops: number;
  returnStops?: number;
  /** Total travel minutes (both ways for round trips), when known. */
  minutes?: number;
  /** Aviasales path like "/search/MNL1503NRT1", when the source gives one. */
  link?: string;
};

export type FaresResponse = {
  fares: Fare[];
  /** True when the server had no token or the API failed: prices are made up. */
  sample: boolean;
  /** When the server fetched these (prices themselves may be older). */
  checkedAt: string;
  error?: string;
};

export type CalendarDay = { date: string; price: number; airline: string; stops: number };
export type CalendarResponse = { days: CalendarDay[]; sample: boolean; checkedAt: string };

export type Pax = { adults: number; kids: number; infants: number };

export type SearchQuery = {
  from: string;
  to: string;
  /** YYYY-MM-DD for exact dates, YYYY-MM for "any day that month". */
  depart: string;
  /** Same formats; empty for one-way. */
  ret?: string;
  pax: Pax;
  directOnly?: boolean;
};
