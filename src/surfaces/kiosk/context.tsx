import { createContext, useContext, useMemo, type Dispatch } from 'react';
import { MODELS, RIVALS, lookup, num, type Model, type Variant } from '../../data';
import { closestVariant } from '../../domain/compare';
import { encodePayload } from '../../domain/payload';
import { recommend, type Recommendation } from '../../domain/recommend';
import type { FuelPrices, SessionRecord } from '../../domain/types';
import type { KioskEvent, KioskState } from '../../state/kioskMachine';

export interface Target {
  model: Model;
  variant: Variant;
  rule: 'sameType' | 'nearestPrice' | 'chosen' | 'sibling';
  sibling: boolean;
}
export interface Kiosk {
  s: KioskState;
  send: Dispatch<KioskEvent>;
  prices: FuelPrices;
  rec: Recommendation;
  pick: { model: Model; variant: Variant } | null;
  target: Target | null;
  crossChannel: boolean;
  payload: string;
}
const Ctx = createContext<Kiosk | null>(null);
export const KioskProvider = Ctx.Provider;
export const useKiosk = (): Kiosk => {
  const k = useContext(Ctx);
  if (!k) throw new Error('useKiosk outside the kiosk');
  return k;
};

export const SIBLING = '@sibling';
const QUICK_DEFAULT = { nexa: 'gv.alphaplus-sh', pod: 'gv.alphaplus-sh', arena: 'vic.vxi-at' } as const;

export function derive(s: KioskState): Omit<Kiosk, 's' | 'send'> {
  const prices: FuelPrices = {
    petrol: s.calc.petrol ?? num('fuel.petrol.delhi')!,
    cng: s.calc.cng ?? num('fuel.cng.delhi')!,
    diesel: s.calc.diesel ?? num('fuel.diesel.delhi')!,
  };
  const rec = recommend(s.answers, s.channel, { models: MODELS, rivals: RIVALS, prices });
  const fallback = rec.noFit?.kind === 'budget' ? rec.noFit.nearest[0]?.variantId : undefined;
  const pickId = s.pickVariantId ?? (s.quick && !s.answers.budget ? QUICK_DEFAULT[s.channel] : null) ?? rec.primary?.variantId ?? fallback ?? null;
  const pick = pickId ? (lookup(pickId) ?? null) : null;

  let target: Target | null = null;
  const key = s.rivalId ?? (s.sibling ? SIBLING : null);
  if (pick && key) {
    if (key === SIBLING) {
      const altId = rec.alternative && rec.alternative.modelId !== pick.model.id ? rec.alternative.variantId : null;
      const sibModel = altId ? lookup(altId)!.model : MODELS.find((m) => m.id !== pick.model.id && m.segment === pick.model.segment) ?? MODELS.find((m) => m.id !== pick.model.id)!;
      const chosen = s.rivalVariantId ? lookup(s.rivalVariantId) : null;
      const variant = chosen && chosen.model.id === sibModel.id ? chosen.variant : altId ? lookup(altId)!.variant : closestVariant(pick.variant, sibModel).variant;
      target = { model: sibModel, variant, rule: 'sibling', sibling: true };
    } else {
      const model = RIVALS.find((r) => r.id === key);
      if (model) {
        const chosen = s.rivalVariantId ? lookup(s.rivalVariantId) : null;
        if (chosen && chosen.model.id === model.id) target = { model, variant: chosen.variant, rule: 'chosen', sibling: false };
        else target = { model, ...closestVariant(pick.variant, model), sibling: false };
      }
    }
  }
  const home = s.channel === 'pod' ? null : s.channel;
  const crossChannel = Boolean(pick && home && pick.model.channel && pick.model.channel !== home);
  const payload = encodePayload({
    v: 2, i: s.sessionId.slice(0, 24), l: s.lang, c: s.channel, p: pick?.variant.id ?? null, r: target?.variant.id ?? null,
    s: s.answers.shortlist.slice(0, 2), b: s.answers.budget, pr: s.answers.priorities, f: s.answers.fuel,
    km: s.calc.km, y: s.calc.years, q: s.questions.map((q) => ({ q: q.q.slice(0, 140), i: q.intent })),
  });
  return { prices, rec, pick, target, crossChannel, payload };
}
export const useDerived = (s: KioskState) => useMemo(() => derive(s), [s]);

/** The record the kiosk publishes. The phone number is included only once the buyer has consented and sent. */
export function toRecord(s: KioskState, d: Omit<Kiosk, 's' | 'send'>, prev?: SessionRecord): SessionRecord {
  const h = s.handoff;
  const mode = h.booked ? 'book' : h.talked ? 'talk' : h.sent ? 'phone' : h.scanned ? 'qr' : null;
  const order = ['attract', 'language', 'shortlist', 'needs', 'match', 'compare', 'ask', 'costs', 'promises', 'handoff', 'done'];
  const furthest = [...s.visited, s.step].sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] ?? s.step;
  return {
    id: s.sessionId, channel: s.channel, lang: s.lang, startedAt: s.startedAt, updatedAt: Date.now(), furthest, quick: s.quick,
    answers: s.answers, pickVariantId: d.pick?.variant.id ?? null, rivalId: d.target && !d.target.sibling ? d.target.model.id : null,
    questions: s.questions,
    handoff: { mode, at: h.at, consent: h.sent && h.consent, phone: h.sent && h.consent ? h.phone : null, slot: h.booked ? h.slot : null, crossChannel: d.crossChannel },
    lead: prev?.lead ?? { status: 'new', contactedAt: null, pledgeExplained: false, referred: false, lostReason: null },
  };
}
/** A session that ends with no hand-off keeps only anonymous counts: the words of the questions are dropped. */
export const anonymise = (r: SessionRecord): SessionRecord => (r.handoff.at ? r : { ...r, questions: r.questions.map((q) => ({ ...q, q: '' })) });
