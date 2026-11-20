import { fil } from './fil';

export type Lang = 'en' | 'fil';

let current: Lang = 'en';

/** Switch languages. The root layout keys the tree on the language so every screen re-renders. */
export function setLang(l: Lang) {
  current = l;
}

export function getLang(): Lang {
  return current;
}

/**
 * Translate by English text. Untranslated strings fall back to English.
 * `{name}` placeholders are filled from `vars`.
 */
export function t(text: string, vars?: Record<string, string | number>): string {
  const s = current === 'fil' ? (fil[text] ?? text) : text;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}
