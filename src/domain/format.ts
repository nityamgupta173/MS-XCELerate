export type Lang = 'en' | 'hi';

const WORDS: Record<string, { en: string; hi: string }> = {
  lakh: { en: 'lakh', hi: 'लाख' },
  crore: { en: 'crore', hi: 'करोड़' },
  years: { en: 'years', hi: 'साल' },
  months: { en: 'months', hi: 'महीने' },
  hours: { en: 'hours', hi: 'घंटे' },
  days: { en: 'days', hi: 'दिन' },
  minutes: { en: 'minutes', hi: 'मिनट' },
  airbags: { en: 'airbags', hi: 'एयरबैग' },
  points: { en: 'points', hi: 'अंक' },
  l: { en: 'litres', hi: 'लीटर' },
  seats: { en: 'seats', hi: 'सीटें' },
};
/** Units that are shown bare (the surrounding sentence names the thing). */
const BARE = new Set(['metros', 'cities', 'outlets', 'pods', 'units', 'listings', 'reviews', 'posts', 'verdicts', 'assistants', 'touchpoints', 'sessions']);

export function formatNumber(n: number, maxFrac = 0, minFrac = 0): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: maxFrac, minimumFractionDigits: minFrac });
}

/** Rupees with Indian conventions: lakh and crore above one lakh, Indian digit grouping below. */
export function formatINR(n: number, lang: Lang = 'en'): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${formatNumber(n / 1e7, 2)} ${WORDS.crore![lang]}`;
  if (abs >= 1e5) return `₹${formatNumber(n / 1e5, 2, 2)} ${WORDS.lakh![lang]}`;
  return `₹${formatNumber(Math.round(n))}`;
}

export function formatValue(value: number | string, unit: string | undefined, lang: Lang = 'en'): string {
  if (typeof value === 'string') return value;
  if (!unit) return formatNumber(value, 2);
  if (unit === 'INR') return formatINR(value, lang);
  if (unit === '%') return `${formatNumber(value, 1)}%`;
  if (unit === 'x') return formatNumber(value, 2);
  if (unit.startsWith('INR/')) return `₹${formatNumber(value, 2, 2)}/${unit.slice(4)}`;
  if (BARE.has(unit)) return formatNumber(value);
  const word = WORDS[unit];
  const frac = Number.isInteger(value) ? 0 : 2;
  return `${formatNumber(value, frac)} ${word ? word[lang] : unit}`;
}

/** Round half up, the way a person reads a price. */
export const roundRupee = (n: number): number => Math.floor(n + 0.5);
