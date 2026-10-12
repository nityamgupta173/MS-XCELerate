/**
 * Simulated pilot data for the council dashboard. Deterministic: same seed, same numbers.
 * Nothing here is a measurement. Every figure it produces is rendered with a "Simulated" tag.
 */
export const SIM_SEED = 20261012;

export const SIM_ASSUMPTIONS = {
  weeks: 8,
  sessionsPerKioskWeek: 70, // about 300 a month, the workbook figure
  // Stage-to-stage pass rates the generator draws around. Assumptions, not findings.
  funnel: { compare: 0.72, ask: 0.55, handoff: 0.42, drive: 0.3, booking: 0.38 },
  controlBookingRate: 0.021,
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type City = 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
export const CITIES: City[] = ['c1', 'c2', 'c3', 'c4', 'c5'];
export type Profile = 'upgrader' | 'family' | 'stylist';
export const FUNNEL_STAGES = ['start', 'compare', 'ask', 'handoff', 'drive', 'booking'] as const;
export type Stage = (typeof FUNNEL_STAGES)[number];

export interface SimRow {
  outlet: string;
  city: City;
  channel: 'nexa' | 'arena';
  week: number;
  funnel: Record<Stage, number>;
  rivals: Record<string, Record<Profile, number>>;
  hindi: number;
  ageKnown: number;
  under35: number;
  newToBrand: number;
  leads: number;
  leadsIn24h: number;
  refOut: number;
  controlVisitors: number;
  controlBookings: number;
}
export interface SimGap {
  id: string;
  count: number;
  slaDays: number;
}

export function simulate(seed = SIM_SEED): { rows: SimRow[]; gaps: SimGap[]; topQuestions: Array<{ id: string; count: number }> } {
  const rnd = mulberry32(seed);
  const around = (mean: number, spread: number) => mean * (1 + (rnd() * 2 - 1) * spread);
  const rows: SimRow[] = [];
  const A = SIM_ASSUMPTIONS;
  for (const city of CITIES) {
    for (const channel of ['nexa', 'arena'] as const) {
      // Two pilot outlets per channel per city: 20 pilot outlets in all.
      for (let n = 1; n <= 2; n++) {
        const outlet = `${city}-${channel}-${n}`;
        const quality = around(1, 0.25);
        for (let week = 1; week <= A.weeks; week++) {
          const start = Math.round(around(A.sessionsPerKioskWeek, 0.25));
          const compare = Math.round(start * around(A.funnel.compare, 0.1));
          const ask = Math.round(compare * around(A.funnel.ask, 0.15));
          const handoff = Math.round(compare * around(A.funnel.handoff, 0.15) * Math.min(quality, 1.2));
          const drive = Math.round(handoff * around(A.funnel.drive, 0.2));
          const booking = Math.round(drive * around(A.funnel.booking, 0.2));
          const mix = (weights: Record<string, number>, total: number, profile: Profile, into: Record<string, Record<Profile, number>>) => {
            const sum = Object.values(weights).reduce((x, y) => x + y, 0);
            for (const [k, w] of Object.entries(weights)) {
              into[k] ??= { upgrader: 0, family: 0, stylist: 0 };
              into[k]![profile] += Math.round((total * around(w, 0.2)) / sum);
            }
          };
          const rivals: Record<string, Record<Profile, number>> = {};
          if (channel === 'nexa') {
            mix({ hy: 3, cr: 4, sel: 2.5, none: 1.5 }, Math.round(compare * 0.62), 'upgrader', rivals);
            mix({ nx: 2, cr: 1, none: 3 }, Math.round(compare * 0.3), 'stylist', rivals);
            mix({ cr: 2, hy: 1, none: 1 }, Math.round(compare * 0.08), 'family', rivals);
          } else {
            mix({ nx: 4.5, cr: 2.5, hy: 1, none: 2 }, Math.round(compare * 0.78), 'family', rivals);
            mix({ cr: 3, hy: 2, sel: 1 }, Math.round(compare * 0.16), 'upgrader', rivals);
            mix({ nx: 2, none: 1 }, Math.round(compare * 0.06), 'stylist', rivals);
          }
          const ageKnown = Math.round(start * around(0.58, 0.15));
          const leadsIn24h = Math.round(handoff * Math.min(around(0.8 * quality, 0.08), 1));
          rows.push({
            outlet, city, channel, week,
            funnel: { start, compare, ask, handoff, drive, booking },
            rivals,
            hindi: Math.round(start * around(channel === 'arena' ? 0.46 : 0.27, 0.2)),
            ageKnown,
            under35: Math.round(ageKnown * around(channel === 'arena' ? 0.41 : 0.49, 0.15)),
            newToBrand: Math.round(booking * around(0.34, 0.3)),
            leads: handoff,
            leadsIn24h,
            refOut: Math.round(handoff * around(channel === 'nexa' ? 0.16 : 0.07, 0.3)),
            controlVisitors: Math.round(around(start * 3.2, 0.15)),
            controlBookings: 0,
          });
          const r = rows[rows.length - 1]!;
          r.controlBookings = Math.round(r.controlVisitors * around(A.controlBookingRate, 0.2));
        }
      }
    }
  }
  const gapIds = ['gap.batteryReplacement', 'gap.waitingPeriod', 'gap.cngBootVictoris', 'gap.accessoryWarranty', 'gap.fastCharger', 'gap.towing'];
  const gaps = gapIds.map((id, i) => ({ id, count: Math.round(around(96 - i * 13, 0.12)), slaDays: i < 2 ? 3 : 7 }));
  const qIds = ['mileage.real', 'twin.same', 'warranty.toyota', 'fuel.monthly', 'crash.rating', 'cng.option', 'promise.what', 'onroad'];
  const topQuestions = qIds.map((id, i) => ({ id, count: Math.round(around(410 - i * 38, 0.08)) }));
  return { rows, gaps, topQuestions };
}
