import type { Channel, Lang } from '../data';
import { canSend } from '../domain/payload';
import { EMPTY_ANSWERS, KM_MID, type AgeId, type Answers, type AskedQuestion, type BudgetId, type FuelPref, type HandoffMode, type KmId, type Priority, type Riders } from '../domain/types';

export type Step = 'attract' | 'language' | 'shortlist' | 'needs' | 'match' | 'compare' | 'ask' | 'costs' | 'promises' | 'handoff' | 'done';
export const FLOW: Step[] = ['shortlist', 'needs', 'match', 'compare', 'ask', 'costs', 'promises', 'handoff'];
export const HUB: Step[] = ['compare', 'ask', 'costs', 'promises'];
export const NEEDS = ['budget', 'km', 'priorities', 'riders', 'fuel', 'age'] as const;
export type NeedKey = (typeof NEEDS)[number];
export type PromiseTab = 'promise' | 'pledge' | 'weekend';
export type CompareGroup = 'basics' | 'running' | 'safety' | 'ownership';

export interface KioskState {
  step: Step;
  needsIndex: number;
  lang: Lang;
  channel: Channel;
  sessionId: string;
  startedAt: number;
  quick: boolean;
  notSure: boolean;
  sibling: boolean;
  answers: Answers;
  /** null = follow the recommendation. */
  pickVariantId: string | null;
  rivalId: string | null;
  rivalVariantId: string | null;
  group: CompareGroup;
  questions: AskedQuestion[];
  calc: { km: number; years: number; petrol: number | null; cng: number | null; diesel: number | null; basis: 'claimed' | 'owner' };
  promiseTab: PromiseTab;
  handoff: { mode: HandoffMode | null; phone: string; consent: boolean; sent: boolean; slot: string | null; booked: boolean; talked: boolean; scanned: boolean; at: number | null };
  idleWarning: boolean;
  wipedNote: boolean;
  visited: Step[];
}

export type KioskEvent =
  | { type: 'START' }
  | { type: 'QUICK_COMPARE' }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'GOTO'; step: Step }
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'TOGGLE_RIVAL'; id: string }
  | { type: 'TOGGLE_SIBLING' }
  | { type: 'NOT_SURE' }
  | { type: 'ANSWER_BUDGET'; value: BudgetId }
  | { type: 'ANSWER_KM'; value: KmId }
  | { type: 'TOGGLE_PRIORITY'; value: Priority }
  | { type: 'ANSWER_RIDERS'; value: Riders }
  | { type: 'ANSWER_FUEL'; value: FuelPref }
  | { type: 'ANSWER_AGE'; value: AgeId | null }
  | { type: 'SET_PICK'; variantId: string }
  | { type: 'SET_RIVAL'; rivalId: string | null; sibling?: boolean }
  | { type: 'SET_RIVAL_VARIANT'; variantId: string }
  | { type: 'SET_GROUP'; group: CompareGroup }
  | { type: 'ASK'; question: AskedQuestion }
  | { type: 'SET_CALC'; patch: Partial<KioskState['calc']> }
  | { type: 'SET_PROMISE_TAB'; tab: PromiseTab }
  | { type: 'HANDOFF_MODE'; mode: HandoffMode | null }
  | { type: 'KEY_DIGIT'; digit: string }
  | { type: 'KEY_DEL' }
  | { type: 'TOGGLE_CONSENT' }
  | { type: 'SEND' }
  | { type: 'SCANNED' }
  | { type: 'PICK_SLOT'; slot: string }
  | { type: 'BOOK' }
  | { type: 'TALK' }
  | { type: 'COMPLETE' }
  | { type: 'IDLE_WARN' }
  | { type: 'CONTINUE' }
  | { type: 'RESET'; note?: boolean }
  | { type: 'HYDRATE'; state: Partial<KioskState> };

let counter = 0;
export const newSessionId = (): string => `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function initialState(channel: Channel, lang: Lang = 'en', now = Date.now()): KioskState {
  return {
    step: 'attract', needsIndex: 0, lang, channel, sessionId: newSessionId(), startedAt: now,
    quick: false, notSure: false, sibling: false,
    answers: { ...EMPTY_ANSWERS, priorities: [], shortlist: [] },
    pickVariantId: null, rivalId: null, rivalVariantId: null, group: 'running',
    questions: [],
    calc: { km: 1150, years: 5, petrol: null, cng: null, diesel: null, basis: 'claimed' },
    promiseTab: 'promise',
    handoff: { mode: null, phone: '', consent: false, sent: false, slot: null, booked: false, talked: false, scanned: false, at: null },
    idleWarning: false, wipedNote: false, visited: [],
  };
}

/** The transition table: which events each state accepts. Anything else is ignored. */
const GLOBAL: KioskEvent['type'][] = ['SET_LANG', 'RESET', 'HYDRATE', 'IDLE_WARN', 'CONTINUE', 'GOTO'];
export const TRANSITIONS: Record<Step, KioskEvent['type'][]> = {
  attract: ['START', 'QUICK_COMPARE'],
  language: ['NEXT', 'BACK'],
  shortlist: ['TOGGLE_RIVAL', 'TOGGLE_SIBLING', 'NOT_SURE', 'NEXT', 'BACK'],
  needs: ['ANSWER_BUDGET', 'ANSWER_KM', 'TOGGLE_PRIORITY', 'ANSWER_RIDERS', 'ANSWER_FUEL', 'ANSWER_AGE', 'NEXT', 'BACK'],
  match: ['NEXT', 'BACK', 'SET_PICK', 'SET_RIVAL', 'HANDOFF_MODE'],
  compare: ['SET_PICK', 'SET_RIVAL', 'SET_RIVAL_VARIANT', 'SET_GROUP', 'NEXT', 'BACK'],
  ask: ['ASK', 'NEXT', 'BACK'],
  costs: ['SET_CALC', 'NEXT', 'BACK'],
  promises: ['SET_PROMISE_TAB', 'HANDOFF_MODE', 'NEXT', 'BACK'],
  handoff: ['HANDOFF_MODE', 'KEY_DIGIT', 'KEY_DEL', 'TOGGLE_CONSENT', 'SEND', 'SCANNED', 'PICK_SLOT', 'BOOK', 'TALK', 'COMPLETE', 'BACK'],
  done: [],
};
export const accepts = (step: Step, type: KioskEvent['type']): boolean => GLOBAL.includes(type) || TRANSITIONS[step].includes(type);

const visit = (s: KioskState, step: Step): KioskState => ({ ...s, step, visited: s.visited.includes(step) ? s.visited : [...s.visited, step] });

export function needAnswered(s: KioskState, key: NeedKey): boolean {
  const a = s.answers;
  if (key === 'priorities') return a.priorities.length > 0;
  if (key === 'age') return true;
  return a[key] !== null;
}
export function canNext(s: KioskState): boolean {
  if (s.step === 'shortlist') return s.answers.shortlist.length > 0 || s.sibling || s.notSure;
  if (s.step === 'needs') return needAnswered(s, NEEDS[s.needsIndex]!);
  return true;
}
/** A step can be jumped to once it has been visited. */
export const canJump = (s: KioskState, step: Step): boolean => s.visited.includes(step) && step !== s.step;

export function reduce(s: KioskState, e: KioskEvent): KioskState {
  if (!accepts(s.step, e.type)) return s;
  // While the "Still there?" overlay is up, only it can be answered.
  if (s.idleWarning && !['CONTINUE', 'RESET', 'HYDRATE'].includes(e.type)) return s;
  switch (e.type) {
    case 'RESET':
      return { ...initialState(s.channel, 'en'), wipedNote: Boolean(e.note) };
    case 'HYDRATE':
      return { ...s, ...e.state, idleWarning: false };
    case 'IDLE_WARN':
      return s.step === 'attract' ? s : { ...s, idleWarning: true };
    case 'CONTINUE':
      return { ...s, idleWarning: false };
    case 'SET_LANG':
      return { ...s, lang: e.lang };
    case 'START':
      return visit({ ...s, wipedNote: false, startedAt: Date.now() }, 'language');
    case 'QUICK_COMPARE':
      return visit({ ...s, wipedNote: false, quick: true, startedAt: Date.now() }, 'shortlist');
    case 'GOTO':
      return canJump(s, e.step) ? { ...s, step: e.step } : s;
    case 'TOGGLE_RIVAL': {
      const has = s.answers.shortlist.includes(e.id);
      const max = s.sibling ? 1 : 2;
      if (!has && s.answers.shortlist.length >= max) return s;
      const shortlist = has ? s.answers.shortlist.filter((x) => x !== e.id) : [...s.answers.shortlist, e.id];
      return { ...s, notSure: false, answers: { ...s.answers, shortlist }, rivalId: shortlist[0] ?? null, rivalVariantId: null };
    }
    case 'TOGGLE_SIBLING': {
      if (!s.sibling && s.answers.shortlist.length >= 2) return s;
      return { ...s, sibling: !s.sibling, notSure: false };
    }
    case 'NOT_SURE':
      return { ...s, notSure: !s.notSure, sibling: false, answers: { ...s.answers, shortlist: [] }, rivalId: null, rivalVariantId: null };
    case 'ANSWER_BUDGET':
      return { ...s, answers: { ...s.answers, budget: e.value }, pickVariantId: null };
    case 'ANSWER_KM':
      return { ...s, answers: { ...s.answers, km: e.value }, calc: { ...s.calc, km: KM_MID[e.value] } };
    case 'TOGGLE_PRIORITY': {
      const p = s.answers.priorities;
      const next = p.includes(e.value) ? p.filter((x) => x !== e.value) : p.length < 2 ? [...p, e.value] : p;
      return { ...s, answers: { ...s.answers, priorities: next }, pickVariantId: null };
    }
    case 'ANSWER_RIDERS':
      return { ...s, answers: { ...s.answers, riders: e.value }, pickVariantId: null };
    case 'ANSWER_FUEL':
      return { ...s, answers: { ...s.answers, fuel: e.value }, pickVariantId: null };
    case 'ANSWER_AGE':
      return visit({ ...s, answers: { ...s.answers, age: e.value } }, 'match');
    case 'NEXT': {
      if (!canNext(s)) return s;
      if (s.step === 'language') return visit(s, 'shortlist');
      if (s.step === 'shortlist') return s.quick ? visit(s, 'compare') : visit({ ...s, needsIndex: 0 }, 'needs');
      if (s.step === 'needs') return s.needsIndex < NEEDS.length - 1 ? { ...s, needsIndex: s.needsIndex + 1 } : visit(s, 'match');
      if (s.step === 'match') return visit(s, 'compare');
      const i = FLOW.indexOf(s.step);
      return i >= 0 && i < FLOW.length - 1 ? visit(s, FLOW[i + 1]!) : s;
    }
    case 'BACK': {
      if (s.step === 'language') return { ...s, step: 'attract' };
      if (s.step === 'shortlist') return { ...s, step: s.quick ? 'attract' : 'language' };
      if (s.step === 'needs') return s.needsIndex > 0 ? { ...s, needsIndex: s.needsIndex - 1 } : { ...s, step: 'shortlist' };
      if (s.step === 'match') return { ...s, step: 'needs', needsIndex: NEEDS.length - 1 };
      if (s.step === 'compare') return { ...s, step: s.quick ? 'shortlist' : 'match' };
      if (s.step === 'handoff' && s.handoff.mode) return { ...s, handoff: { ...s.handoff, mode: null } };
      const i = FLOW.indexOf(s.step);
      return i > 0 ? { ...s, step: FLOW[i - 1]! } : s;
    }
    case 'SET_PICK':
      return { ...s, pickVariantId: e.variantId, rivalVariantId: null };
    case 'SET_RIVAL':
      return { ...s, rivalId: e.rivalId, sibling: e.sibling ?? s.sibling, rivalVariantId: null };
    case 'SET_RIVAL_VARIANT':
      return { ...s, rivalVariantId: e.variantId };
    case 'SET_GROUP':
      return { ...s, group: e.group };
    case 'ASK':
      return { ...s, questions: [...s.questions, e.question].slice(-12) };
    case 'SET_CALC': {
      const c = { ...s.calc, ...e.patch };
      c.km = Math.min(Math.max(Math.round(c.km / 50) * 50, 100), 6000);
      c.years = Math.min(Math.max(Math.round(c.years), 1), 7);
      return { ...s, calc: c };
    }
    case 'SET_PROMISE_TAB':
      return { ...s, promiseTab: e.tab };
    case 'HANDOFF_MODE':
      return visit({ ...s, handoff: { ...s.handoff, mode: e.mode } }, 'handoff');
    case 'KEY_DIGIT':
      return s.handoff.sent || s.handoff.phone.length >= 10 || !/^\d$/.test(e.digit) ? s : { ...s, handoff: { ...s.handoff, phone: s.handoff.phone + e.digit } };
    case 'KEY_DEL':
      return s.handoff.sent ? s : { ...s, handoff: { ...s.handoff, phone: s.handoff.phone.slice(0, -1) } };
    case 'TOGGLE_CONSENT':
      return s.handoff.sent ? s : { ...s, handoff: { ...s.handoff, consent: !s.handoff.consent } };
    case 'SEND':
      return canSend(s.handoff.phone, s.handoff.consent) ? { ...s, handoff: { ...s.handoff, sent: true, at: s.handoff.at ?? Date.now() } } : s;
    case 'SCANNED':
      return { ...s, handoff: { ...s.handoff, scanned: true } };
    case 'PICK_SLOT':
      return s.handoff.booked ? s : { ...s, handoff: { ...s.handoff, slot: e.slot } };
    case 'BOOK':
      return s.handoff.slot ? { ...s, handoff: { ...s.handoff, booked: true, at: s.handoff.at ?? Date.now() } } : s;
    case 'TALK':
      return { ...s, handoff: { ...s.handoff, talked: true, at: s.handoff.at ?? Date.now() } };
    case 'COMPLETE':
      return { ...s, step: 'done' };
  }
}

/** Edges for the generated state diagram (scripts/gen-statechart.ts) and the edge-walk test. */
export const EDGES: Array<[Step, string, Step]> = [
  ['attract', 'START', 'language'], ['attract', 'QUICK_COMPARE', 'shortlist'], ['language', 'NEXT', 'shortlist'],
  ['shortlist', 'NEXT', 'needs'], ['shortlist', 'NEXT (quick compare)', 'compare'], ['needs', 'NEXT x5 / ANSWER_AGE', 'match'],
  ['match', 'NEXT', 'compare'], ['match', 'HANDOFF_MODE', 'handoff'], ['compare', 'NEXT', 'ask'], ['ask', 'NEXT', 'costs'],
  ['costs', 'NEXT', 'promises'], ['promises', 'NEXT / HANDOFF_MODE', 'handoff'], ['handoff', 'COMPLETE', 'done'], ['done', 'RESET (button or 20 s)', 'attract'],
];
