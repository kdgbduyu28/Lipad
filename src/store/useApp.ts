import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Lang } from '../i18n';
import type { Style } from '../data/spending';
import type { Scope } from '../lib/planner';
import type { Pax, SearchQuery } from '../lib/types';

export type ThemePref = 'system' | 'light' | 'dark';

export type Saved = {
  id: string;
  q: SearchQuery;
  /** Cheapest price when saved / last checked, for the price-watch arrow. */
  lastPrice?: number;
  prevPrice?: number;
  checkedAt?: string;
};

export type PlanDraft = {
  from: string;
  budget: number;
  when: 'month' | 'dates' | 'longweekend';
  month: string;
  depart: string;
  nights: number;
  pax: Pax;
  scope: Scope;
  style: Style;
};

type State = {
  settings: { theme: ThemePref; lang: Lang; home: string };
  draft: SearchQuery;
  recent: SearchQuery[];
  saved: Saved[];
  plan: PlanDraft | null;
  setSettings: (s: Partial<State['settings']>) => void;
  setDraft: (d: Partial<SearchQuery>) => void;
  addRecent: (q: SearchQuery) => void;
  clearRecent: () => void;
  toggleSaved: (q: SearchQuery, price?: number) => void;
  updateSaved: (id: string, price: number, checkedAt: string) => void;
  removeSaved: (id: string) => void;
  setPlan: (p: PlanDraft | null) => void;
};

export const savedId = (q: SearchQuery) => `${q.from}-${q.to}-${q.depart}-${q.ret ?? ''}-${q.pax.adults}${q.pax.kids}${q.pax.infants}`;

const NOOP = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };

export const ONE_ADULT: Pax = { adults: 1, kids: 0, infants: 0 };

export const useApp = create<State>()(
  persist(
    (set) => ({
      settings: { theme: 'system', lang: 'en', home: 'MNL' },
      draft: { from: 'MNL', to: '', depart: '', ret: '', pax: ONE_ADULT },
      recent: [],
      saved: [],
      plan: null,
      setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      setDraft: (d) => set((st) => ({ draft: { ...st.draft, ...d } })),
      addRecent: (q) =>
        set((st) => ({ recent: [q, ...st.recent.filter((r) => savedId(r) !== savedId(q))].slice(0, 6) })),
      clearRecent: () => set({ recent: [] }),
      toggleSaved: (q, price) =>
        set((st) => {
          const id = savedId(q);
          if (st.saved.some((s) => s.id === id)) return { saved: st.saved.filter((s) => s.id !== id) };
          return { saved: [{ id, q, lastPrice: price, checkedAt: new Date().toISOString() }, ...st.saved] };
        }),
      updateSaved: (id, price, checkedAt) =>
        set((st) => ({
          saved: st.saved.map((s) => (s.id === id ? { ...s, prevPrice: s.lastPrice ?? price, lastPrice: price, checkedAt } : s)),
        })),
      removeSaved: (id) => set((st) => ({ saved: st.saved.filter((s) => s.id !== id) })),
      setPlan: (plan) => set({ plan }),
    }),
    {
      name: 'lipad',
      // Static rendering runs in Node, where there's no storage; skip it there.
      storage: createJSONStorage(() => (typeof window === 'undefined' ? NOOP : AsyncStorage)),
      version: 1,
    },
  ),
);
