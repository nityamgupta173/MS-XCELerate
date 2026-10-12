import type { Channel, Lang } from '../data';

export type BudgetId = 'u10' | 'b10_14' | 'b14_18' | 'b18_22' | 'o22' | 'all';
export const BUDGETS: Record<BudgetId, { min: number; max: number }> = {
  u10: { min: 0, max: 1000000 },
  b10_14: { min: 1000000, max: 1400000 },
  b14_18: { min: 1400000, max: 1800000 },
  b18_22: { min: 1800000, max: 2200000 },
  o22: { min: 2200000, max: Infinity },
  all: { min: 0, max: Infinity },
};
export type KmId = 'k800' | 'k1500' | 'k2500' | 'k3000';
/** Midpoints stored for the calculators; the buyer can change the figure later. */
export const KM_MID: Record<KmId, number> = { k800: 600, k1500: 1150, k2500: 2000, k3000: 3000 };
export type Priority = 'running' | 'safety' | 'resale' | 'design' | 'performance' | 'capability';
export const PRIORITIES: Priority[] = ['running', 'safety', 'resale', 'design', 'performance', 'capability'];
export type Riders = 'few' | 'family' | 'many';
export type FuelPref = 'petrol' | 'cng' | 'hybrid' | 'ev' | 'any';
export type AgeId = 'u25' | 'a25_34' | 'a35_44' | 'o45';

export interface Answers {
  budget: BudgetId | null;
  km: KmId | null;
  priorities: Priority[];
  riders: Riders | null;
  fuel: FuelPref | null;
  age: AgeId | null;
  shortlist: string[];
}
export const EMPTY_ANSWERS: Answers = { budget: null, km: null, priorities: [], riders: null, fuel: null, age: null, shortlist: [] };

export interface FuelPrices {
  petrol: number;
  cng: number;
  diesel: number;
}

/** A computed number, with enough attached for the UI to show how it was worked out. */
export interface CalcValue {
  id: string;
  value: number;
  unit: string;
  formula: string;
  inputs: Array<{ fact: string } | { label: string; value: number; unit: string }>;
}

export interface AskedQuestion {
  q: string;
  intent: string | null;
  route: 'answer' | 'expert' | 'unanswered';
  lang: Lang;
  at: number;
}

export type HandoffMode = 'qr' | 'phone' | 'book' | 'talk';
export type LeadStatus = 'new' | 'contacted' | 'booked' | 'lost';

/** What the kiosk publishes for the tablet and the council. The phone number is only present after consent. */
export interface SessionRecord {
  id: string;
  sample?: boolean;
  channel: Channel;
  lang: Lang;
  startedAt: number;
  updatedAt: number;
  furthest: string;
  quick: boolean;
  answers: Answers;
  pickVariantId: string | null;
  rivalId: string | null;
  questions: AskedQuestion[];
  handoff: {
    mode: HandoffMode | null;
    at: number | null;
    consent: boolean;
    phone: string | null;
    slot: string | null;
    crossChannel: boolean;
  };
  lead: {
    status: LeadStatus;
    contactedAt: number | null;
    pledgeExplained: boolean;
    referred: boolean;
    lostReason: string | null;
    deleted?: boolean;
  };
}
