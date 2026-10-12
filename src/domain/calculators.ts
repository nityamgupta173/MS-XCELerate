/** Pure cost-of-ownership arithmetic. No rounding here: round only when a value is shown. */

export function fuelCostPer1000km(efficiency: number, pricePerUnit: number): number {
  if (!(efficiency > 0)) throw new RangeError('efficiency must be positive');
  return (1000 / efficiency) * pricePerUnit;
}

export function monthlyCost(km: number, efficiency: number, pricePerUnit: number): number {
  if (!(efficiency > 0)) throw new RangeError('efficiency must be positive');
  return (km / efficiency) * pricePerUnit;
}

export interface BreakEven {
  /** Distance at which the dearer car's extra price is recovered. */
  km: number;
  /** Months to reach that distance at the buyer's monthly distance. */
  months: number;
}
/**
 * priceGap: how much more the more efficient car costs up front (positive).
 * savingPer1000km: how much less it costs to run per 1,000 km (positive).
 * Returns null when the gap is never recovered.
 */
export function breakEven(priceGap: number, savingPer1000km: number, monthlyKm: number): BreakEven | null {
  if (priceGap <= 0) return { km: 0, months: 0 };
  if (savingPer1000km <= 0 || monthlyKm <= 0) return null;
  const km = (priceGap / savingPer1000km) * 1000;
  return { km, months: km / monthlyKm };
}

export interface CostSeries {
  id: string;
  price: number;
  monthly: number;
}
export interface CumulativePoint {
  month: number;
  cost: number;
}
/** Ex-showroom price plus fuel, month by month. Service, insurance and resale are excluded. */
export function cumulativeCost(series: CostSeries[], years: number): Record<string, CumulativePoint[]> {
  const months = Math.round(years * 12);
  const out: Record<string, CumulativePoint[]> = {};
  for (const s of series) {
    out[s.id] = Array.from({ length: months + 1 }, (_, m) => ({ month: m, cost: s.price + s.monthly * m }));
  }
  return out;
}

/** EV running cost per km. Only call with a sourced consumption figure. */
export function evCostPerKm(kwhPer100km: number, tariffPerKwh: number): number {
  if (!(kwhPer100km > 0)) throw new RangeError('consumption must be positive');
  return (kwhPer100km / 100) * tariffPerKwh;
}
