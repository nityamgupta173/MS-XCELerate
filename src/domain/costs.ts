import { num, type Model, type Variant } from '../data';
import { breakEven, cumulativeCost, monthlyCost, type CumulativePoint } from './calculators';
import { per1000, priceFor } from './compare';
import type { CalcValue, FuelPrices } from './types';

export type Basis = 'claimed' | 'owner';

/** Owner-reported efficiency exists for the Grand Vitara strong hybrid only. We use the low end of the range. */
export function ownerEfficiency(model: Model, variant: Variant): number | null {
  return model.id === 'gv' && variant.fuel === 'hybrid' ? num('gv.sh.owner.low') : null;
}
export function efficiencyFor(model: Model, variant: Variant, basis: Basis): { value: number; owner: boolean } | null {
  const owner = basis === 'owner' ? ownerEfficiency(model, variant) : null;
  if (owner) return { value: owner, owner: true };
  const claimed = num(variant.facts.efficiency);
  return claimed ? { value: claimed, owner: false } : null;
}

export interface CarCost {
  id: string;
  per1000: CalcValue;
  monthly: CalcValue;
  total: CalcValue;
  price: number;
  ownerBasis: boolean;
}
export function carCost(model: Model, variant: Variant, prices: FuelPrices, km: number, years: number, basis: Basis): CarCost | null {
  const eff = efficiencyFor(model, variant, basis);
  const fp = priceFor(variant, prices);
  const price = num(variant.facts.price);
  if (!eff || !fp || price === null) return null;
  const p = per1000(variant, prices, eff.owner ? eff.value : undefined)!;
  const unit = variant.fuel === 'cng' ? 'km/kg' : 'km/l';
  const effInput = eff.owner ? { fact: 'gv.sh.owner.low' } : { fact: variant.facts.efficiency! };
  const fuelInput = fp.price === num(fp.fact) ? { fact: fp.fact } : { label: 'yourFuelPrice', value: fp.price, unit: variant.fuel === 'cng' ? 'INR/kg' : 'INR/l' };
  const monthlyValue = monthlyCost(km, eff.value, fp.price);
  const monthly: CalcValue = { id: `monthly.${variant.id}`, value: monthlyValue, unit: 'INR', formula: 'monthly', inputs: [{ label: 'km', value: km, unit: 'km' }, effInput, fuelInput] };
  const months = years * 12;
  const total: CalcValue = {
    id: `total.${variant.id}`, value: price + monthlyValue * months, unit: 'INR', formula: 'total',
    inputs: [{ fact: variant.facts.price }, { label: 'monthly', value: monthlyValue, unit: 'INR' }, { label: 'months', value: months, unit: 'months' }],
  };
  void unit;
  return { id: variant.id, per1000: p, monthly, total, price, ownerBasis: eff.owner };
}

export type PayBack =
  | { kind: 'catchesUp'; dear: string; gap: CalcValue; saving: CalcValue; km: CalcValue; months: CalcValue; beyond: boolean }
  | { kind: 'never'; dear: string; gap: CalcValue }
  | { kind: 'cheaperBoth'; cheap: string }
  | { kind: 'samePrice' };

/** When does the dearer of two cars recover its extra price through lower fuel cost? */
export function payBack(a: CarCost, b: CarCost, km: number, years: number): PayBack {
  if (a.price === b.price) return { kind: 'samePrice' };
  const [dear, cheap] = a.price > b.price ? [a, b] : [b, a];
  const gapValue = dear.price - cheap.price;
  const savingValue = cheap.per1000.value - dear.per1000.value;
  const gap: CalcValue = { id: 'gap', value: gapValue, unit: 'INR', formula: 'priceGap', inputs: [{ label: 'priceGap', value: gapValue, unit: 'INR' }] };
  if (savingValue <= 0) return savingValue < 0 || gapValue > 0 ? (savingValue < 0 ? { kind: 'cheaperBoth', cheap: cheap.id } : { kind: 'never', dear: dear.id, gap }) : { kind: 'samePrice' };
  const be = breakEven(gapValue, savingValue, km)!;
  const saving: CalcValue = { id: 'saving', value: savingValue, unit: 'INR', formula: 'saving', inputs: [{ label: 'saving', value: savingValue, unit: 'INR' }] };
  const kmCalc: CalcValue = { id: 'breakeven.km', value: be.km, unit: 'km', formula: 'breakEvenKm', inputs: [{ label: 'priceGap', value: gapValue, unit: 'INR' }, { label: 'saving', value: savingValue, unit: 'INR' }] };
  const months: CalcValue = { id: 'breakeven.months', value: Math.ceil(be.months), unit: 'months', formula: 'breakEvenMonths', inputs: [{ label: 'breakKm', value: be.km, unit: 'km' }, { label: 'km', value: km, unit: 'km' }] };
  return { kind: 'catchesUp', dear: dear.id, gap, saving, km: kmCalc, months, beyond: be.months > years * 12 };
}

export function costSeries(cars: CarCost[], years: number): Record<string, CumulativePoint[]> {
  return cumulativeCost(cars.map((c) => ({ id: c.id, price: c.price, monthly: c.monthly.value })), years);
}
