import { describe, expect, it } from 'vitest';
import { MODELS, QA, RIVALS, lookup, num } from '../../src/data';
import { breakEven, cumulativeCost, evCostPerKm, fuelCostPer1000km, monthlyCost } from '../../src/domain/calculators';
import { buildRows, closestVariant, honestRead, isTwinPair, per1000 } from '../../src/domain/compare';
import { formatINR, formatNumber, formatValue, roundRupee } from '../../src/domain/format';
import { canSend, decodePayload, encodePayload, isValidPhone, maskPhone, type Payload } from '../../src/domain/payload';
import { guessProfile } from '../../src/domain/profile';
import { ask } from '../../src/domain/qa';
import { recommend, weightsFor, type Catalogue } from '../../src/domain/recommend';
import { simulate } from '../../src/domain/simulate';
import { EMPTY_ANSWERS, type Answers } from '../../src/domain/types';

const PETROL = num('fuel.petrol.delhi')!;
const prices = { petrol: PETROL, cng: num('fuel.cng.delhi')!, diesel: num('fuel.diesel.delhi')! };
const cat: Catalogue = { models: MODELS, rivals: RIVALS, prices };
const A = (a: Partial<Answers>): Answers => ({ ...EMPTY_ANSWERS, ...a });

describe('calculators: the checks in the brief, section 11.2', () => {
  it('uses the petrol price the brief quotes', () => expect(PETROL).toBe(102.12));
  it('fuel per 1,000 km', () => {
    expect(roundRupee(fuelCostPer1000km(27.97, PETROL))).toBe(3651);
    expect(roundRupee(fuelCostPer1000km(17.7, PETROL))).toBe(5769);
    expect(roundRupee(fuelCostPer1000km(28.65, PETROL))).toBe(3564);
  });
  it('Grand Vitara saving over the Creta CVT and its break-even', () => {
    const saving = fuelCostPer1000km(17.7, PETROL) - fuelCostPer1000km(27.97, PETROL);
    expect(roundRupee(saving)).toBe(2118);
    const gap = num('gv.alphaplus-sh.price')! - num('cr.king-ivt.price')!;
    expect(gap).toBe(93200); // the brief rounds both prices to lakh and gets 93,000
    const be = breakEven(93000, saving, 2000)!;
    expect(Math.round(be.km / 100) * 100).toBe(43900);
    expect(Math.round(be.months)).toBe(22);
  });
  it('monthly fuel at 1,500 km: Rs 5,477 from unrounded inputs (the brief prints 5,476)', () => {
    expect(roundRupee(monthlyCost(1500, 27.97, PETROL))).toBe(5477);
    expect(roundRupee(monthlyCost(1500, 24, PETROL))).toBe(6383);
    expect(roundRupee(monthlyCost(1500, 20, PETROL))).toBe(7659);
  });
  it('break-even edge cases', () => {
    expect(breakEven(50000, 0, 1000)).toBeNull();
    expect(breakEven(50000, -10, 1000)).toBeNull();
    expect(breakEven(0, 100, 1000)).toEqual({ km: 0, months: 0 });
  });
  it('cumulative cost and EV cost', () => {
    const c = cumulativeCost([{ id: 'a', price: 1000, monthly: 10 }], 1);
    expect(c.a).toHaveLength(13);
    expect(c.a![12]!.cost).toBe(1120);
    expect(evCostPerKm(12, 8)).toBeCloseTo(0.96);
    expect(() => fuelCostPer1000km(0, 100)).toThrow();
  });
  it('kiosk economics reconcile with the workbook', () => {
    const total = (num('roll.nexa.outlets')! + num('roll.arena.outlets')!) * num('econ.run')! + num('prog.content.cost')!;
    expect(Math.round(total / 1e5) * 1e5).toBe(num('econ.total'));
  });
});

describe('format: Indian conventions', () => {
  it('groups digits the Indian way', () => expect(formatNumber(123456)).toBe('1,23,456'));
  it('uses lakh and crore', () => {
    expect(formatINR(1962000)).toBe('₹19.62 lakh');
    expect(formatINR(104500000)).toBe('₹10.45 crore');
    expect(formatINR(5476.58)).toBe('₹5,477');
    expect(formatINR(1962000, 'hi')).toBe('₹19.62 लाख');
  });
  it('formats units', () => {
    expect(formatValue(27.97, 'km/l')).toBe('27.97 km/l');
    expect(formatValue(45000, 'km')).toBe('45,000 km');
    expect(formatValue(102.12, 'INR/l')).toBe('₹102.12/l');
    expect(formatValue(60, '%')).toBe('60%');
  });
});

describe('recommendation engine', () => {
  const cases: Array<{ name: string; channel: 'nexa' | 'arena' | 'pod'; a: Partial<Answers>; expect: (r: ReturnType<typeof recommend>) => void }> = [
    {
      name: '1. Arrived Upgrader at NEXA: resale then design, hybrid, 18-22 lakh -> Grand Vitara top hybrid',
      channel: 'nexa', a: { budget: 'b18_22', priorities: ['resale', 'design'], fuel: 'hybrid', riders: 'few', shortlist: ['hy', 'sel'] },
      expect: (r) => { expect(r.primary?.variantId).toBe('gv.alphaplus-sh'); expect(r.crossChannel).toBe(false); expect(r.rivalNotes).toHaveLength(2); },
    },
    {
      name: '2. NEXA kiosk recommends an Arena model: safety then running cost, hybrid, 14-18 lakh -> Victoris',
      channel: 'nexa', a: { budget: 'b14_18', priorities: ['safety', 'running'], fuel: 'hybrid', riders: 'family' },
      expect: (r) => { expect(r.primary?.modelId).toBe('vic'); expect(r.primary?.channel).toBe('arena'); expect(r.crossChannel).toBe(true); },
    },
    {
      name: '3. Arena kiosk recommends a NEXA model: design then running cost, CNG, under 10 lakh -> Fronx',
      channel: 'arena', a: { budget: 'u10', priorities: ['design', 'running'], fuel: 'cng', riders: 'few' },
      expect: (r) => { expect(r.primary?.variantId).toBe('frx.delta-cng'); expect(r.crossChannel).toBe(true); },
    },
    {
      name: '4. First-SUV Family at Arena: safety then running cost, CNG, 10-14 lakh -> Victoris CNG',
      channel: 'arena', a: { budget: 'b10_14', priorities: ['safety', 'running'], fuel: 'cng', riders: 'family', shortlist: ['nx'] },
      expect: (r) => { expect(r.primary?.variantId).toBe('vic.vxi-cng'); expect(r.crossChannel).toBe(false); },
    },
    {
      name: '5. Seven seats: no SUV fits, MPVs suggested',
      channel: 'nexa', a: { budget: 'b14_18', priorities: ['safety'], riders: 'many', fuel: 'any' },
      expect: (r) => { expect(r.noFit?.kind).toBe('seats'); expect(r.primary).toBeNull(); },
    },
    {
      name: '6. Budget too low: strong hybrid under 10 lakh -> nearest options and the gap, stated',
      channel: 'nexa', a: { budget: 'u10', priorities: ['running'], fuel: 'hybrid', riders: 'few' },
      expect: (r) => {
        expect(r.primary).toBeNull();
        expect(r.noFit?.kind).toBe('budget');
        if (r.noFit?.kind === 'budget') { expect(r.noFit.gap.value).toBe(num('vic.vxi-sh.price')! - 1000000); expect(r.noFit.nearest.length).toBe(2); }
      },
    },
    {
      name: '7. EV preference -> e Vitara only',
      channel: 'nexa', a: { budget: 'b14_18', priorities: ['safety', 'performance'], fuel: 'ev', riders: 'family' },
      expect: (r) => { expect(r.primary?.modelId).toBe('ev'); expect(r.alternative).toBeNull(); },
    },
    {
      name: '8. Show me everything: capability first -> a four-wheel-drive variant',
      channel: 'pod', a: { budget: 'all', priorities: ['capability'], fuel: 'any', riders: 'few' },
      expect: (r) => { expect(lookup(r.primary!.variantId)!.variant.drive).not.toBe('FWD'); expect(r.crossChannel).toBe(false); },
    },
    {
      name: '9. A rival wins the top priority: performance first, Creta shortlisted -> said plainly',
      channel: 'nexa', a: { budget: 'b18_22', priorities: ['performance'], fuel: 'petrol', riders: 'few', shortlist: ['cr'] },
      expect: (r) => { expect(r.primary).not.toBeNull(); expect(r.rivalNotes[0]!.rivalWinsTop).toBe(true); expect(r.rivalNotes[0]!.rows).toContain('power'); },
    },
    {
      name: '10. A rival wins on safety: Grand Vitara is unrated, Seltos has five stars',
      channel: 'nexa', a: { budget: 'b18_22', priorities: ['resale', 'safety'], fuel: 'hybrid', riders: 'few', shortlist: ['sel'] },
      expect: (r) => { expect(r.primary?.modelId).toBe('gv'); expect(r.rivalNotes[0]!.rows).toContain('crash'); },
    },
    {
      name: '11. Above every price: budget over 22 lakh -> says so, shows the top of the range',
      channel: 'nexa', a: { budget: 'o22', priorities: ['design'], fuel: 'any', riders: 'few' },
      expect: (r) => { expect(r.noFit?.kind).toBe('aboveRange'); expect(r.primary).not.toBeNull(); },
    },
    {
      name: '12. Running cost with no fuel preference under 10 lakh -> a CNG variant',
      channel: 'arena', a: { budget: 'u10', priorities: ['running'], fuel: 'any', riders: 'family' },
      expect: (r) => expect(lookup(r.primary!.variantId)!.variant.fuel).toBe('cng'),
    },
    {
      name: '13. The answers change the recommendation',
      channel: 'nexa', a: { budget: 'b10_14', priorities: ['capability'], fuel: 'petrol', riders: 'few' },
      expect: (r) => expect(r.primary?.modelId).toBe('jim'),
    },
    {
      name: '14. An alternative is always a different model',
      channel: 'nexa', a: { budget: 'b14_18', priorities: ['running', 'safety'], fuel: 'hybrid', riders: 'family' },
      expect: (r) => { expect(r.alternative).not.toBeNull(); expect(r.alternative!.modelId).not.toBe(r.primary!.modelId); },
    },
  ];
  it.each(cases)('$name', (c) => c.expect(recommend(A(c.a), c.channel, cat)));

  it('weights: 60/40 for two priorities, all of it for one', () => {
    expect(weightsFor(['safety', 'running'])).toEqual({ safety: 0.6, running: 0.4 });
    expect(weightsFor(['safety'])).toEqual({ safety: 1 });
    expect(weightsFor([])).toEqual({});
  });
  it('is not rigged: at least four different models can be the primary pick', () => {
    const seen = new Set<string>();
    for (const budget of ['u10', 'b10_14', 'b14_18', 'b18_22'] as const)
      for (const p of ['running', 'safety', 'resale', 'design', 'performance', 'capability'] as const)
        for (const fuel of ['petrol', 'cng', 'hybrid', 'ev', 'any'] as const) {
          const r = recommend(A({ budget, priorities: [p], fuel, riders: 'few' }), 'nexa', cat);
          if (r.primary) seen.add(r.primary.modelId);
        }
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });
  it('every reason cites facts that exist or a calculation', () => {
    const r = recommend(A({ budget: 'b18_22', priorities: ['resale', 'design'], fuel: 'hybrid', riders: 'few' }), 'nexa', cat);
    expect(r.primary!.reasons.length).toBeGreaterThan(0);
    for (const reason of r.primary!.reasons) expect(reason.facts.length + (reason.calc ? 1 : 0)).toBeGreaterThan(0);
  });
});

describe('comparison', () => {
  it('matches the same type of engine at the nearest price', () => {
    const gv = lookup('gv.alphaplus-sh')!.variant;
    expect(closestVariant(gv, RIVALS.find((r) => r.id === 'hy')!)).toMatchObject({ variant: { id: 'hy.v-sh' }, rule: 'sameType' });
    expect(closestVariant(gv, RIVALS.find((r) => r.id === 'cr')!)).toMatchObject({ variant: { id: 'cr.king-turbo' }, rule: 'nearestPrice' });
    expect(closestVariant(lookup('vic.vxi-cng')!.variant, RIVALS.find((r) => r.id === 'nx')!).variant.id).toBe('nx.smartplus-cng');
  });
  it('per 1,000 km reproduces the brief', () => expect(roundRupee(per1000(lookup('gv.alphaplus-sh')!.variant, prices)!.value)).toBe(3651));
  it('leaves the electric out of cost comparisons', () => expect(per1000(lookup('ev.delta')!.variant, prices)).toBeNull());
  it('marks the better value per row and never an overall winner', () => {
    const rows = buildRows('gv.alphaplus-sh', 'cr.king-ivt', prices);
    expect(rows.find((r) => r.key === 'per1000')!.better).toBe('a');
    expect(rows.find((r) => r.key === 'boot')!.better).toBeNull(); // hybrid boot is unverified, so no marker
    expect(rows.find((r) => r.key === 'warranty')!.better).toBe('b');
    expect(rows.find((r) => r.key === 'buyback')).toMatchObject({ proposed: true, better: null });
  });
  it('the honest read lists where the rival is ahead', () => {
    const read = honestRead(buildRows('gv.delta-at', 'cr.exo-ivt', prices));
    expect(read.theirs).toContain('boot');
    expect(read.ours).toContain('per1000');
  });
  it('same-car evidence is for the hybrid twins only', () => {
    expect(isTwinPair('gv.alphaplus-sh', 'hy.v-sh')).toBe(true);
    expect(isTwinPair('gv.alphaplus-sh', 'cr.king-ivt')).toBe(false);
    expect(isTwinPair('gv.sigma', 'hy.e')).toBe(false);
  });
  it('a row with unverified data on one side shows a verify cell, not a number', () => {
    const rows = buildRows('gv.alphaplus-sh', 'hy.v-sh', prices);
    expect('verify' in rows.find((r) => r.key === 'gc')!.b).toBe(true);
  });
});

describe('Q&A matcher', () => {
  const must: Array<[string, string, string]> = [
    ['twin.same', 'Is the Grand Vitara the same car as the Hyryder?', 'grand vitara aur hyryder same hai kya'],
    ['warranty.toyota', 'is toyota warranty longer', 'क्या Toyota की वारंटी ज़्यादा लंबी है?'],
    ['fuel.monthly', 'monthly fuel cost', 'mahine ka petrol kharcha kitna'],
    ['mileage.real', 'real world mileage', 'असल में मालिकों को कितनी माइलेज मिलती है?'],
    ['hybrid.how', 'how does the strong hybrid work', 'strong hybrid kya hota hai'],
    ['hybrid.plug', 'do i need to plug it in', 'क्या इसे चार्जिंग पर लगाना पड़ता है?'],
    ['hybrid.battery', 'battery warranty', 'battery ki warranty kitni hai'],
    ['crash.rating', 'what is the crash test rating', 'क्रैश टेस्ट रेटिंग क्या है?'],
    ['adas', 'does it have adas', 'adas hai kya isme'],
    ['boot', 'boot space', 'डिक्की में कितनी जगह है'],
    ['awd', 'is awd available', 'awd milta hai kya'],
    ['cng.option', 'is there a cng option', 'क्या CNG का विकल्प है?'],
    ['resale', 'resale value', 'resale value kitni milegi'],
    ['promise.what', 'what is the higher ground promise', 'Higher Ground Promise क्या है?'],
    ['promise.catch', 'what is the catch with the promise', 'buyback ki shartein kya hai'],
    ['pledge.what', 'what is the service pledge', 'Service Pledge क्या है?'],
    ['weekend.what', 'what is weekend ownership', 'weekend ownership kya hai'],
    ['price.offers', 'what is the on road price', 'कितना डिस्काउंट मिलेगा'],
    ['seltos.vs.gv', 'seltos vs grand vitara', 'seltos ya grand vitara'],
    ['nexon.brezza.safety', 'is the nexon safer than the brezza', 'nexon ya brezza kaun safe hai'],
    ['victoris.vs.gv', 'victoris vs grand vitara', 'Victoris और Grand Vitara में क्या फ़र्क है?'],
    ['channel.which', 'which showroom sells which suv', 'nexa aur arena me kya fark hai'],
    ['ev.charging', 'how long does the e vitara take to charge', 'charging me kitna time lagta hai'],
    ['data.what', 'what happens to my data', 'मेरे डेटा का क्या होता है?'],
  ];
  it.each(must)('answers "%s" in English and Hindi', (id, en, hi) => {
    expect(ask(en).intent?.id).toBe(id);
    expect(ask(hi).intent?.id).toBe(id);
  });
  it('routes price, offers and finance to the product expert', () => {
    for (const q of ['any discount on this', 'best offer please', 'on-road price in delhi', 'exchange bonus kitna', 'ऑफर क्या है']) expect(ask(q)).toMatchObject({ route: 'expert', intent: { id: 'price.offers' } });
    expect(ask('what will my emi be').intent?.id).toBe('guard.finance');
  });
  it('will not discuss rivals\' faults or unlaunched models', () => {
    expect(ask('creta engine problems').intent?.id).toBe('guard.rivalfaults');
    expect(ask('is the hyryder unreliable').intent?.id).toBe('guard.rivalfaults');
    expect(ask('when is the 7 seater grand vitara coming').intent?.id).toBe('guard.unlaunched');
  });
  it('says so when it has no checked answer', () => {
    for (const q of ['can it tow a caravan', 'what colour is best for vastu', 'sunroof leak hota hai kya', 'xyzzy']) expect(ask(q).route).toBe('unanswered');
  });
  it('has 50 to 80 intents, each with five or more variants per language', () => {
    expect(QA.length).toBeGreaterThanOrEqual(50);
    expect(QA.length).toBeLessThanOrEqual(80);
    for (const q of QA) { expect(q.q.en.length).toBeGreaterThanOrEqual(5); expect(q.q.hi.length).toBeGreaterThanOrEqual(5); }
  });
});

describe('hand-off payload and consent', () => {
  const p: Payload = { v: 2, i: 'abc123', l: 'hi', c: 'arena', p: 'vic.vxi-cng', r: 'nx.smartplus-cng', s: ['nx'], b: 'b10_14', pr: ['safety', 'running'], f: 'cng', km: 1150, y: 5, q: [{ q: 'क्या Nexon ज़्यादा सुरक्षित है?', i: 'nexon.brezza.safety' }] };
  it('round-trips', () => expect(decodePayload(encodePayload(p))).toEqual({ ok: true, payload: p }));
  it('round-trips with a leading hash', () => expect(decodePayload('#' + encodePayload(p)).ok).toBe(true));
  it('rejects malformed input', () => {
    expect(decodePayload('not-a-payload').ok).toBe(false);
    expect(decodePayload('').ok).toBe(false);
    expect(decodePayload(encodePayload(p).slice(0, 20)).ok).toBe(false);
  });
  it('has no field that could carry a phone number', () => {
    expect(Object.keys(p).sort()).toEqual(['b', 'c', 'f', 'i', 'km', 'l', 'p', 'pr', 'q', 'r', 's', 'v', 'y']);
    expect(() => encodePayload({ ...p, phone: '9876543210' } as Payload)).not.toThrow();
    const decoded = decodePayload(encodePayload({ ...p, phone: '9876543210' } as Payload));
    expect(decoded.ok && 'phone' in decoded.payload).toBe(false);
  });
  it('consent gating: Send needs a valid number and a ticked box', () => {
    expect(canSend('9876543210', false)).toBe(false);
    expect(canSend('98765', true)).toBe(false);
    expect(canSend('1234567890', true)).toBe(false);
    expect(canSend('9876543210', true)).toBe(true);
    expect(isValidPhone('98765432101')).toBe(false);
  });
  it('masks the number for staff', () => expect(maskPhone('9876543210')).toBe('••••••••10'));
});

describe('profile guess and simulator', () => {
  it('guesses one of three profiles with a reason', () => {
    expect(guessProfile({ channel: 'nexa', answers: A({ budget: 'u10' }), pickVariantId: 'frx.delta-cng' }).profile).toBe('stylist');
    expect(guessProfile({ channel: 'arena', answers: A({ riders: 'family' }), pickVariantId: 'vic.vxi-cng' }).profile).toBe('family');
    expect(guessProfile({ channel: 'nexa', answers: A({ shortlist: ['hy'] }), pickVariantId: 'gv.alphaplus-sh' })).toEqual({ profile: 'upgrader', reason: 'profile.why.crossShop' });
  });
  it('the simulator is deterministic and has 20 pilot outlets', () => {
    const a = simulate();
    const b = simulate();
    expect(a).toEqual(b);
    expect(new Set(a.rows.map((r) => r.outlet)).size).toBe(num('roll.pilot.outlets'));
    expect(simulate(1).rows).not.toEqual(a.rows);
    for (const r of a.rows) { expect(r.funnel.compare).toBeLessThanOrEqual(r.funnel.start); expect(r.leadsIn24h).toBeLessThanOrEqual(r.leads); }
  });
});
