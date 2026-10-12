import { cmp, num, powerPS, type Channel, type Model, type Variant } from '../data';
import { buildRows, closestVariant, per1000, type RowKey } from './compare';
import { BUDGETS, type Answers, type CalcValue, type FuelPrices, type Priority } from './types';

export interface Catalogue {
  models: Model[];
  rivals: Model[];
  prices: FuelPrices;
}
export interface Reason {
  key: string;
  facts: string[];
  calc?: CalcValue;
  /** True when the criterion rests on a declared proxy rather than sourced attributes. */
  verify?: boolean;
}
export interface Scored {
  variantId: string;
  modelId: string;
  channel: 'nexa' | 'arena';
  score: number;
  parts: Partial<Record<Priority, number>>;
  reasons: Reason[];
}
export interface RivalNote {
  rivalId: string;
  rivalVariantId: string;
  /** The rival's closest variant beats our pick on the buyer's first priority. */
  rivalWinsTop: boolean;
  /** Rows where the rival is ahead, strongest first. Empty when the published figures do not separate them. */
  rows: RowKey[];
}
export type NoFit =
  | { kind: 'seats' }
  | { kind: 'budget'; gap: CalcValue; nearest: Scored[] }
  | { kind: 'aboveRange' };
export interface Recommendation {
  primary: Scored | null;
  alternative: Scored | null;
  rivalNotes: RivalNote[];
  noFit: NoFit | null;
  /** The primary is sold in the other channel: a dual-credit referral. */
  crossChannel: boolean;
  weights: Partial<Record<Priority, number>>;
}

/** First priority 60, second 40. A single priority takes all of it. */
export function weightsFor(priorities: Priority[]): Partial<Record<Priority, number>> {
  const [a, b] = priorities;
  if (!a) return {};
  if (!b) return { [a]: 1 };
  return { [a]: 0.6, [b]: 0.4 };
}

const TOP_ROWS: Record<Priority, RowKey[]> = {
  running: ['per1000'],
  safety: ['crash', 'adas', 'airbags'],
  resale: [],
  design: [],
  performance: ['power'],
  capability: ['gc'],
};

interface Cand {
  model: Model;
  variant: Variant;
  price: number;
}

function raw(c: Cand, p: Priority, prices: FuelPrices): number | null {
  const v = c.variant.facts;
  const m = c.model.facts;
  switch (p) {
    case 'running': {
      const cost = per1000(c.variant, prices);
      return cost ? -cost.value : null;
    }
    case 'safety':
      return ((cmp(m.crash) ?? 0) / 5) * 0.5 + (Math.min(num(m.airbags) ?? 0, 7) / 7) * 0.25 + ((cmp(v.adas) ?? 0) / 2) * 0.25;
    case 'resale':
      // Every Maruti Suzuki SUV carries the proposed Promise and the same warranty; only some have resale evidence.
      return 1 + (c.model.resaleEvidence ? 1 : 0);
    case 'design': {
      // Declared proxy until feature lists are in the checked library: position in the model's own price walk.
      const ps = c.model.variants.map((x) => num(x.facts.price) ?? 0);
      const lo = Math.min(...ps);
      const hi = Math.max(...ps);
      return hi === lo ? 1 : (c.price - lo) / (hi - lo);
    }
    case 'performance':
      return powerPS(v.power);
    case 'capability':
      return (c.variant.drive !== 'FWD' ? 1 : 0) + (num(m.groundClearance) ?? 0) / 250;
  }
}

/** Launch rule, used only to break ties: family, safety and CNG lean Arena; design, hybrid and EV lean NEXA. */
function launchRuleFit(model: Model, a: Answers): number {
  const signals = new Set<string>();
  if (a.riders === 'family') signals.add('family');
  if (a.priorities.includes('safety')) signals.add('safety');
  if (a.fuel === 'cng') signals.add('cng');
  if (a.priorities.includes('design')) signals.add('design');
  if (a.fuel === 'hybrid') signals.add('hybrid');
  if (a.fuel === 'ev') signals.add('ev');
  if (a.priorities.includes('capability')) signals.add('capability');
  return model.tags.filter((t) => signals.has(t)).length;
}

function reasonsFor(c: Cand, a: Answers, prices: FuelPrices): Reason[] {
  const v = c.variant.facts;
  const m = c.model.facts;
  const out: Reason[] = [];
  const push = (r: Reason) => {
    if (out.length < 3 && !out.some((x) => x.key === r.key)) out.push(r);
  };
  for (const p of a.priorities) {
    if (p === 'running') {
      const cost = per1000(c.variant, prices);
      if (cost) push({ key: 'reason.running', facts: [], calc: cost });
      else push({ key: 'reason.running.unscored', facts: ['ev.consumption'], verify: true });
    } else if (p === 'safety') {
      push({ key: (cmp(m.crash) ?? 0) > 0 ? 'reason.safety.rated' : 'reason.safety.unrated', facts: [m.crash!] });
      if ((cmp(v.adas) ?? 0) > 0) push({ key: 'reason.adas', facts: [v.adas!] });
      if (num(m.airbags) !== null) push({ key: 'reason.airbags', facts: [m.airbags!] });
    } else if (p === 'resale') {
      push({ key: 'reason.promise', facts: ['prog.promise.pct', 'prog.promise.years', 'prog.promise.km'] });
      if (c.model.resaleEvidence) push({ key: 'reason.resale.evidence', facts: ['resale.residual', 'resale.ratio'] });
    } else if (p === 'design') {
      push({ key: 'reason.design', facts: [v.price], verify: true });
    } else if (p === 'performance') {
      if (powerPS(v.power) !== null) push({ key: 'reason.performance', facts: [v.power!] });
    } else if (p === 'capability') {
      if (c.variant.drive !== 'FWD') push({ key: 'reason.awd', facts: [v.powertrain] });
      if (num(m.groundClearance) !== null) push({ key: 'reason.clearance', facts: [m.groundClearance!] });
    }
  }
  if (a.budget && a.budget !== 'all') push({ key: 'reason.budget', facts: [v.price] });
  if (a.fuel && a.fuel !== 'any') push({ key: `reason.fuel.${c.variant.fuel}`, facts: [v.powertrain] });
  if (m.warranty && cmp(m.warranty) !== null) push({ key: 'reason.warranty', facts: [m.warranty] });
  return out;
}

function rank(cands: Cand[], a: Answers, prices: FuelPrices): Scored[] {
  const w = weightsFor(a.priorities);
  const chosen = Object.keys(w) as Priority[];
  const norm = new Map<Priority, (c: Cand) => number>();
  for (const p of chosen) {
    const vals = cands.map((c) => raw(c, p, prices));
    const known = vals.filter((x): x is number => x !== null);
    const lo = Math.min(...known);
    const hi = Math.max(...known);
    norm.set(p, (c) => {
      const r = raw(c, p, prices);
      if (r === null) return 0;
      return hi === lo ? 1 : (r - lo) / (hi - lo);
    });
  }
  const scored = cands.map((c) => {
    const parts: Partial<Record<Priority, number>> = {};
    let score = 0;
    for (const p of chosen) {
      const n = norm.get(p)!(c);
      parts[p] = n;
      score += n * (w[p] ?? 0);
    }
    return { c, score, parts };
  });
  scored.sort((x, y) => {
    if (Math.abs(x.score - y.score) > 0.02) return y.score - x.score;
    const fit = launchRuleFit(y.c.model, a) - launchRuleFit(x.c.model, a);
    if (fit !== 0) return fit;
    return x.c.price - y.c.price;
  });
  return scored.map(({ c, score, parts }) => ({
    variantId: c.variant.id,
    modelId: c.model.id,
    channel: c.model.channel!,
    score,
    parts,
    reasons: reasonsFor(c, a, prices),
  }));
}

export function rivalNote(pickVariant: Variant, rival: Model, a: Answers, prices: FuelPrices): RivalNote {
  const { variant } = closestVariant(pickVariant, rival);
  const rows = buildRows(pickVariant.id, variant.id, prices);
  const theirs = rows.filter((r) => r.better === 'b').map((r) => r.key);
  const top = a.priorities[0];
  const topRows = top ? TOP_ROWS[top] : [];
  const rivalAhead = topRows.filter((k) => theirs.includes(k)).length;
  const oursAhead = topRows.filter((k) => rows.some((r) => r.key === k && r.better === 'a')).length;
  const rivalWinsTop = rivalAhead > 0 && rivalAhead > oursAhead;
  const order: RowKey[] = [...topRows, 'price', 'crash', 'adas', 'per1000', 'power', 'boot', 'warranty', 'gc', 'airbags', 'torque'];
  const ordered = [...new Set(order)].filter((k) => theirs.includes(k)).slice(0, 2);
  return { rivalId: rival.id, rivalVariantId: variant.id, rivalWinsTop, rows: ordered };
}

export function recommend(answers: Answers, channel: Channel, cat: Catalogue): Recommendation {
  const weights = weightsFor(answers.priorities);
  const empty: Recommendation = { primary: null, alternative: null, rivalNotes: [], noFit: null, crossChannel: false, weights };
  if (answers.riders === 'many') return { ...empty, noFit: { kind: 'seats' } };

  const all: Cand[] = cat.models.flatMap((model) => model.variants.map((variant) => ({ model, variant, price: num(variant.facts.price) ?? 0 })));
  const byFuel = answers.fuel && answers.fuel !== 'any' ? all.filter((c) => c.variant.fuel === answers.fuel) : all;
  const band = BUDGETS[answers.budget ?? 'all'];
  let pool = byFuel.filter((c) => c.price >= band.min && c.price <= band.max);
  let noFit: NoFit | null = null;

  if (!pool.length && byFuel.length) {
    const cheapest = [...byFuel].sort((x, y) => x.price - y.price)[0]!;
    if (cheapest.price > band.max) {
      const nearest: Cand[] = [];
      for (const c of [...byFuel].sort((x, y) => x.price - y.price)) {
        if (!nearest.some((n) => n.model.id === c.model.id)) nearest.push(c);
        if (nearest.length === 2) break;
      }
      const gap: CalcValue = {
        id: 'budget.gap',
        value: cheapest.price - band.max,
        unit: 'INR',
        formula: 'budgetGap',
        inputs: [{ fact: cheapest.variant.facts.price }, { label: 'yourBudgetTop', value: band.max, unit: 'INR' }],
      };
      return { ...empty, noFit: { kind: 'budget', gap, nearest: rank(nearest, answers, cat.prices) } };
    }
    // Everything we sell costs less than the band: say so, then show the top of the range.
    noFit = { kind: 'aboveRange' };
    pool = byFuel;
  }
  if (!pool.length) return empty;

  const ranked = rank(pool, answers, cat.prices);
  const primary = ranked[0]!;
  const alternative = ranked.find((s) => s.modelId !== primary.modelId) ?? null;
  const home = channel === 'pod' ? null : channel;
  const pickVariant = cat.models.flatMap((m) => m.variants).find((v) => v.id === primary.variantId)!;
  const rivalNotes = answers.shortlist
    .map((id) => cat.rivals.find((r) => r.id === id))
    .filter((r): r is Model => Boolean(r))
    .map((r) => rivalNote(pickVariant, r, answers, cat.prices));
  return { primary, alternative, rivalNotes, noFit, crossChannel: home !== null && primary.channel !== home, weights };
}
