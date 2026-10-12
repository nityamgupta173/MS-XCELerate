import { z } from 'zod';
import factsJson from './facts.json';
import modelsJson from './models.json';
import rivalsJson from './rivals.json';
import qaJson from './qa.json';
import en from './copy.en.json';
import hi from './copy.hi.json';
import { copySchema, factSchema, modelSchema, qaIntentSchema, rivalsFileSchema, type Fact, type Model, type Variant } from './schema';

export const FACT_LIST: Fact[] = z.array(factSchema).parse(factsJson);
export const FACTS: ReadonlyMap<string, Fact> = new Map(FACT_LIST.map((f) => [f.id, f]));
export const MODELS: Model[] = z.array(modelSchema).parse(modelsJson);
const rivalsFile = rivalsFileSchema.parse(rivalsJson);
export const RIVALS: Model[] = rivalsFile.models;
export const SHORTLIST = rivalsFile.shortlist;
export const MPVS = rivalsFile.mpvs;
export const QA = z.array(qaIntentSchema).parse(qaJson);
export const COPY = { en: copySchema.parse(en), hi: copySchema.parse(hi) };
export type Lang = keyof typeof COPY;
export type Channel = 'nexa' | 'arena' | 'pod';

export const ALL_MODELS: Model[] = [...MODELS, ...RIVALS];
const variantIndex = new Map<string, { model: Model; variant: Variant }>();
for (const m of ALL_MODELS) for (const v of m.variants) variantIndex.set(v.id, { model: m, variant: v });

export function fact(id: string): Fact {
  const f = FACTS.get(id);
  if (!f) throw new Error(`Unknown fact id: ${id}`);
  return f;
}
export const num = (id: string | null | undefined): number | null => {
  if (!id) return null;
  const v = FACTS.get(id)?.value;
  return typeof v === 'number' ? v : null;
};
/** Comparable magnitude of a fact: its `cmp` key if it has one, else its numeric value. */
export const cmp = (id: string | null | undefined): number | null => {
  if (!id) return null;
  const f = FACTS.get(id);
  if (!f || f.value === null) return null;
  return f.cmp ?? (typeof f.value === 'number' ? f.value : null);
};
export const modelById = (id: string): Model | undefined => ALL_MODELS.find((m) => m.id === id);
export const lookup = (variantId: string) => variantIndex.get(variantId);
export const isRival = (m: Model) => m.channel === null;
/** Power in PS, whatever unit the source used. */
export const powerPS = (id: string | null): number | null => {
  if (!id) return null;
  const f = FACTS.get(id);
  if (!f || typeof f.value !== 'number') return null;
  return f.unit === 'bhp' ? f.value * 1.01387 : f.value;
};
export type { Fact, Model, Variant };
