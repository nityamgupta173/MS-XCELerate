import { cmp, fact, FACTS, isRival, lookup, num, powerPS, type Model, type Variant } from '../data';
import { fuelCostPer1000km } from './calculators';
import type { CalcValue, FuelPrices } from './types';

export type RowKey =
  | 'builtAt' | 'powertrain' | 'power' | 'torque' | 'efficiency' | 'per1000' | 'price' | 'warranty'
  | 'airbags' | 'crash' | 'adas' | 'boot' | 'gc' | 'buyback' | 'repeatRepair';

export type Cell = { fact: string } | { calc: CalcValue } | { verify: string } | { none: true };
export interface Row {
  key: RowKey;
  a: Cell;
  b: Cell;
  better: 'a' | 'b' | null;
  proposed?: boolean;
}

export function priceFor(v: Variant, p: FuelPrices): { price: number; fact: string } | null {
  if (v.fuel === 'ev') return null;
  if (v.fuel === 'cng') return { price: p.cng, fact: 'fuel.cng.delhi' };
  if (v.fuel === 'diesel') return { price: p.diesel, fact: 'fuel.diesel.delhi' };
  return { price: p.petrol, fact: 'fuel.petrol.delhi' };
}

/** Fuel cost per 1,000 km for a variant at the given prices. `efficiency` overrides the claimed figure. */
export function per1000(v: Variant, p: FuelPrices, efficiency?: number): CalcValue | null {
  const eff = efficiency ?? num(v.facts.efficiency);
  const fp = priceFor(v, p);
  if (!eff || !fp) return null;
  const defaultPrice = num(fp.fact);
  return {
    id: `per1000.${v.id}`,
    value: fuelCostPer1000km(eff, fp.price),
    unit: 'INR',
    formula: 'per1000',
    inputs: [
      efficiency === undefined && v.facts.efficiency ? { fact: v.facts.efficiency } : { label: 'efficiency', value: eff, unit: v.fuel === 'cng' ? 'km/kg' : 'km/l' },
      fp.price === defaultPrice ? { fact: fp.fact } : { label: 'yourFuelPrice', value: fp.price, unit: v.fuel === 'cng' ? 'INR/kg' : 'INR/l' },
    ],
  };
}

/**
 * Like-for-like rule: the rival variant with the same type of engine, at the nearest price.
 * If the rival has no such engine, the nearest price overall.
 */
export function closestVariant(ours: Variant, rival: Model): { variant: Variant; rule: 'sameType' | 'nearestPrice' } {
  const price = num(ours.facts.price) ?? 0;
  const gap = (v: Variant) => Math.abs((num(v.facts.price) ?? Infinity) - price);
  const nearest = (list: Variant[]) => [...list].sort((x, y) => gap(x) - gap(y))[0]!;
  const same = rival.variants.filter((v) => v.fuel === ours.fuel && v.drive === ours.drive);
  const sameFuel = same.length ? same : rival.variants.filter((v) => v.fuel === ours.fuel);
  if (sameFuel.length) return { variant: nearest(sameFuel), rule: 'sameType' };
  return { variant: nearest(rival.variants.filter((v) => v.fuel !== 'diesel')), rule: 'nearestPrice' };
}

const cell = (id: string | null, what: string): Cell => {
  if (!id) return { none: true };
  const f = FACTS.get(id);
  if (!f || f.value === null) return { verify: f?.label ?? what };
  return { fact: id };
};
const has = (c: Cell) => 'fact' in c || 'calc' in c;

function pick(a: number | null, b: number | null, lowerIsBetter = false): 'a' | 'b' | null {
  if (a === null || b === null || a === b) return null;
  return a < b === lowerIsBetter ? 'a' : 'b';
}

export function buildRows(aId: string, bId: string, prices: FuelPrices): Row[] {
  const A = lookup(aId);
  const B = lookup(bId);
  if (!A || !B) return [];
  const rows: Row[] = [];
  const add = (key: RowKey, a: Cell, b: Cell, better: 'a' | 'b' | null, proposed = false) => {
    if (!has(a) && !has(b)) return;
    const fill = (c: Cell): Cell => ('none' in c ? { verify: key } : c);
    rows.push({ key, a: fill(a), b: fill(b), better: has(a) && has(b) ? better : null, ...(proposed ? { proposed } : {}) });
  };
  const av = A.variant.facts;
  const bv = B.variant.facts;
  const am = A.model.facts;
  const bm = B.model.facts;

  add('builtAt', cell(am.builtAt, 'builtAt'), cell(bm.builtAt, 'builtAt'), null);
  add('powertrain', cell(av.powertrain, 'powertrain'), cell(bv.powertrain, 'powertrain'), null);
  add('power', cell(av.power, 'power'), cell(bv.power, 'power'), pick(powerPS(av.power), powerPS(bv.power)));
  add('torque', cell(av.torque, 'torque'), cell(bv.torque, 'torque'), pick(num(av.torque), num(bv.torque)));
  const sameUnit = av.efficiency && bv.efficiency && fact(av.efficiency).unit === fact(bv.efficiency).unit;
  add('efficiency', cell(av.efficiency ?? av.range, 'efficiency'), cell(bv.efficiency ?? bv.range, 'efficiency'), sameUnit ? pick(num(av.efficiency), num(bv.efficiency)) : null);
  const ac = per1000(A.variant, prices);
  const bc = per1000(B.variant, prices);
  add('per1000', ac ? { calc: ac } : { none: true }, bc ? { calc: bc } : { none: true }, pick(ac?.value ?? null, bc?.value ?? null, true));
  add('price', cell(av.price, 'price'), cell(bv.price, 'price'), pick(num(av.price), num(bv.price), true));
  add('warranty', cell(am.warranty, 'warranty'), cell(bm.warranty, 'warranty'), pick(cmp(am.warranty), cmp(bm.warranty)));
  add('airbags', cell(am.airbags, 'airbags'), cell(bm.airbags, 'airbags'), pick(num(am.airbags), num(bm.airbags)));
  add('crash', cell(am.crash, 'crash'), cell(bm.crash, 'crash'), pick(cmp(am.crash), cmp(bm.crash)));
  add('adas', cell(av.adas, 'adas'), cell(bv.adas, 'adas'), pick(cmp(av.adas), cmp(bv.adas)));
  const aBoot = av.boot ?? am.boot;
  const bBoot = bv.boot ?? bm.boot;
  add('boot', cell(aBoot, 'boot'), cell(bBoot, 'boot'), pick(num(aBoot), num(bBoot)));
  add('gc', cell(am.groundClearance, 'gc'), cell(bm.groundClearance, 'gc'), pick(num(am.groundClearance), num(bm.groundClearance)));
  const promise = (m: Model, ours: string, theirs: string): Cell => (isRival(m) ? { verify: fact(theirs).label } : { fact: ours });
  add('buyback', promise(A.model, 'prog.promise.text', 'rival.buyback'), promise(B.model, 'prog.promise.text', 'rival.buyback'), null, true);
  add('repeatRepair', promise(A.model, 'prog.pledge.text', 'rival.repeatrepair'), promise(B.model, 'prog.pledge.text', 'rival.repeatrepair'), null, true);
  return rows;
}

/** Order in which a row is worth mentioning in a short summary. */
const WEIGHT: RowKey[] = ['price', 'crash', 'per1000', 'adas', 'power', 'boot', 'warranty', 'gc', 'airbags', 'torque', 'efficiency'];

export interface HonestRead {
  /** Rows where side B (the car being compared against) is ahead. Always stated first. */
  theirs: RowKey[];
  ours: RowKey[];
  gaps: number;
}
export function honestRead(rows: Row[], limit = 3): HonestRead {
  const order = (keys: RowKey[]) => keys.sort((x, y) => WEIGHT.indexOf(x) - WEIGHT.indexOf(y)).slice(0, limit);
  const of = (side: 'a' | 'b') => rows.filter((r) => r.better === side && WEIGHT.includes(r.key) && !(r.key === 'efficiency' && rows.some((x) => x.key === 'per1000' && x.better === side))).map((r) => r.key);
  return {
    theirs: order(of('b')),
    ours: order(of('a')),
    gaps: rows.filter((r) => 'verify' in r.a || 'verify' in r.b).length,
  };
}

/** The same-car evidence panel only applies to the Grand Vitara against its Bidadi twin. */
export const isTwinPair = (aId: string, bId: string): boolean => {
  const A = lookup(aId);
  const B = lookup(bId);
  return Boolean(A && B && ((A.model.id === 'gv' && B.model.id === 'hy') || (A.model.id === 'hy' && B.model.id === 'gv')) && A.variant.fuel === 'hybrid' && B.variant.fuel === 'hybrid');
};
