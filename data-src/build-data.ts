/**
 * Canonical data entry. Edit here, then `npm run data:build`.
 * Emits src/data/facts.json, models.json, rivals.json (all zod-validated by `npm run data:check`).
 * Rule: no value without a source. Unknown = null + status "needs-verification" (renders a [VERIFY] chip).
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const R = '2026-10-12';
type Status = 'verified' | 'from-team-research' | 'needs-verification';
type Kind = 'published' | 'team-research' | 'proposal' | 'assumption';
interface Src { source: string; url?: string; doc?: string; status: Status; kind: Kind; retrieved?: string }

const cd = (path: string, what: string): Src => ({
  source: `CarDekho, ${what} (page states "Prices updated October 2026")`,
  url: `https://www.cardekho.com/${path}`, status: 'verified', kind: 'published',
});
const web = (source: string, url: string, status: Status = 'verified'): Src => ({ source, url, status, kind: 'published' });
const team = (doc: string, kind: Kind = 'team-research'): Src => ({ source: 'Team research', doc, status: 'from-team-research', kind });
const gap = (why: string): Src => ({ source: 'Not yet sourced', doc: `DATA_GAPS.md: ${why}`, status: 'needs-verification', kind: 'published' });

const S = {
  gvP: cd('maruti/grand-vitara/price-in-new-delhi', 'Grand Vitara price in New Delhi'),
  gvS: cd('maruti/grand-vitara/specs', 'Grand Vitara specifications'),
  vicP: cd('maruti/victoris/price-in-new-delhi', 'Victoris price in New Delhi'),
  vicS: cd('maruti/victoris/specs', 'Victoris specifications'),
  brzP: cd('maruti/brezza/price-in-new-delhi', 'Brezza price in New Delhi'),
  frxP: cd('maruti/fronx/price-in-new-delhi', 'Fronx price in New Delhi'),
  evP: cd('maruti/e-vitara/price-in-new-delhi', 'e Vitara price in New Delhi'),
  jimP: cd('maruti/jimny/price-in-new-delhi', 'Jimny price in New Delhi'),
  hyP: cd('toyota/urban-cruiser-hyryder/price-in-new-delhi', 'Hyryder price in New Delhi'),
  hyS: cd('toyota/urban-cruiser-hyryder/specs', 'Hyryder specifications'),
  crP: cd('hyundai/creta/price-in-new-delhi', 'Creta price in New Delhi'),
  crS: cd('hyundai/creta/specs', 'Creta specifications'),
  selP: cd('kia/seltos/price-in-new-delhi', 'Seltos price in New Delhi'),
  selS: cd('kia/seltos/specs', 'Seltos specifications'),
  nxP: cd('tata/nexon/price-in-new-delhi', 'Nexon price in New Delhi'),
  bncap: web('Autocar India, "Every car tested by Bharat NCAP so far", 16 Sep 2026', 'https://www.autocarindia.com/auto-features-amp/every-car-suv-tested-by-bharat-ncap-so-far-431936'),
  acGv: web('Autocar India, Grand Vitara model page', 'https://www.autocarindia.com/cars/maruti-suzuki/grand-vitara'),
  acCr: web('Autocar India, Creta specifications', 'https://www.autocarindia.com/cars/hyundai/creta/specifications'),
  acSel: web('Autocar India, new Seltos model page, updated 12 Oct 2026', 'https://www.autocarindia.com/cars/kia/new-seltos'),
  acNx: web('Autocar India, Nexon model page, updated 12 Oct 2026', 'https://www.autocarindia.com/cars/tata/nexon'),
  rlVic: web('Rushlane, "New Maruti Victoris variants, features, specs, mileage"', 'https://www.rushlane.com/new-maruti-victoris-variants-features-specs-mileage-12529405.html'),
  gvCng: web('Gaadify, Grand Vitara CNG specs and mileage', 'https://gaadify.com/maruti-suzuki-grand-vitara-gets-cng-kit-price-specs-mileage'),
  brzM: web('Gaadify, "2026 Maruti Brezza facelift mileage figures revealed", 27 Jul 2026', 'https://gaadify.com/2026-maruti-brezza-facelift-mileage-figures-revealed/'),
  brzL: web('CarDekho, 2026 Brezza facelift launch report', 'https://www.cardekho.com/india-car-news/2026-maruti-brezza-facelift-launched-find-all-details-including-features-design-powertrain-specifications-and-pricing-here-36369.htm'),
  frxS: web('91wheels, Fronx specifications', 'https://91wheels.com/cars/maruti/fronx/specifications'),
  frxB: web('Business Standard, Fronx prices and claimed mileage', 'https://www.business-standard.com/industry/auto/maruti-fronx-prices-revealed-a-better-buy-than-baleno-brezza-see-details-123042400534_1.html'),
  evT: web('Times Drive, e Vitara detailed price list and variants', 'https://www.timesdrive.in/news/maruti-suzuki-e-vitara-detailed-price-list-revealed-check-variant-wise-pricing-article-153635944/amp'),
  jimS: web('Autocar India, Jimny specifications', 'https://www.autocarindia.com/cars-specs/maruti-suzuki/jimny'),
  ctBat: web('CarTrade, Grand Vitara Alpha Plus strong hybrid listing', 'https://www.cartrade.com/maruti-suzuki-cars/grand-vitara/alpha-plus-intelligent-hybrid-e-cvt-dual-tone/'),
  petrol: web('The Hans India daily fuel table, 9 Oct 2026 (same figure on 1, 3, 5, 7 Oct)', 'https://www.thehansindia.com/business/petrol-and-diesel-prices-today-in-hyderabad-delhi-chennai-and-mumbai-on-9-october-2026-1130565'),
  cng: web('Outlook Money, IGL revision effective 29 Aug 2026', 'https://www.outlookmoney.com/news/cng-price-hike-delhi-ncr-rates-rise-by-rs-389-per-kg-from-august-29'),
  mpv: web('91wheels, XL6 vs Ertiga', 'https://www.91wheels.com/news/maruti-suzuki-xl6-vs-maruti-suzuki-ertiga'),
  brief: team('Round 2 brief, section 11.2'),
  deck1: team('Round 1 deck'),
  prog: team('Round 2 brief, section 1 (programme design)', 'proposal'),
  org: team('Round 2 brief, section 1 (organisation design)', 'proposal'),
  wb: team('Team workbook (kiosk economics), via Round 2 brief section 1'),
};

type V = number | string | null;
interface Fact { id: string; value: V; unit?: string; cmp?: number; label: string; source: string; url?: string; doc?: string;
  retrieved: string; status: Status; kind: Kind; asOf?: string; note?: string; verifiedAbsent?: boolean }
const facts: Fact[] = [];
const seen = new Set<string>();
function f(id: string, value: V, unit: string | undefined, label: string, src: Src, extra: Partial<Fact> = {}): string {
  if (seen.has(id)) throw new Error(`duplicate fact ${id}`);
  seen.add(id);
  const { source, url, doc, status, kind } = src;
  facts.push({ id, value, ...(unit ? { unit } : {}), label, source, ...(url ? { url } : {}), ...(doc ? { doc } : {}), retrieved: R, status, kind, ...extra });
  return id;
}

// ---------- Shared facts ----------
f('fuel.petrol.delhi', 102.12, 'INR/l', 'Petrol price, Delhi', S.petrol, { asOf: '2026-10-09', note: 'The brief flagged this figure for re-verification. It is confirmed by five consecutive published daily tables for 1-9 Oct 2026. An IOCL-published notice was not found; IOCL retail prices moved to partial pass-through in May 2026.' });
f('fuel.diesel.delhi', 95.2, 'INR/l', 'Diesel price, Delhi', S.petrol, { asOf: '2026-10-09' });
f('fuel.cng.delhi', 86.98, 'INR/kg', 'CNG price, Delhi (IGL)', S.cng, { asOf: '2026-08-29', note: 'Latest IGL revision found. One Hindi report gave 83.09 for the same date; three English reports agree on 86.98.' });

const W_MSIL = f('msil.warranty', '3 years / 1,00,000 km', undefined, 'Grand Vitara standard warranty', S.acGv, { cmp: 100000 });
const W_MSIL_O = f('msil.warranty.range', '3 years / 1,00,000 km', undefined, 'Maruti Suzuki standard warranty (other models)', { ...gap('confirmed on the Grand Vitara listing only; check each model page'), source: 'Autocar India, Grand Vitara model page (applied to other Maruti Suzuki models)' , url: S.acGv.url, doc: undefined }, { cmp: 100000 });
const W_HY = f('hy.warranty', '3 years / 1,00,000 km', undefined, 'Hyryder standard warranty', team('Team AI-audit note, via Round 2 brief section 11.2'), { cmp: 100000, asOf: '2024-07', note: 'Identical to the Grand Vitara since July 2024.' });
f('warranty.parity.since', 'July 2024', undefined, 'Grand Vitara and Hyryder warranties identical since', team('Team AI-audit note, via Round 2 brief section 11.2'));

const META = team('This build: retrieval dates and the Round 2 brief', 'assumption');
f('meta.event', 'XCELerate 2026', undefined, 'Competition', META);
f('meta.period', 'Sep-Oct 2026', undefined, 'Period the published figures describe', META);
f('meta.checked', '12 Oct 2026', undefined, 'Date the library was last checked', META);
f('law.dpdp', 'Digital Personal Data Protection Act, 2023', undefined, 'Privacy law the consent flow follows', team('Round 2 brief, section 17'));
f('sales.period', 'H1 2026', undefined, 'Period of the twin sales comparison', team('Round 2 brief, section 1 (diagnosis)'));
f('rule.weight.first', 60, '%', 'Weight on the first priority chosen', team('Round 2 brief, section 12 (engine design)', 'assumption'));
f('rule.weight.second', 40, '%', 'Weight on the second priority chosen', team('Round 2 brief, section 12 (engine design)', 'assumption'));
// Programme (all proposals)
f('prog.promise.pct', 60, '%', 'Higher Ground Promise: guaranteed buyback share of net ex-showroom price', S.prog);
f('prog.promise.years', 3, 'years', 'Higher Ground Promise: term', S.prog);
f('prog.promise.km', 45000, 'km', 'Higher Ground Promise: distance limit', S.prog);
f('prog.promise.text', 'Guaranteed buyback: 60% at 3 years / 45,000 km', undefined, 'Higher Ground Promise terms', S.prog);
f('prog.pledge.hours', 24, 'hours', 'Service Pledge: loaner car within', S.prog);
f('prog.pledge.text', 'Fixed first time, or a loaner car within 24 hours', undefined, 'Service Pledge terms', S.prog);
f('prog.weekend.hours', 48, 'hours', 'Weekend Ownership: length of test drive', S.prog);
f('prog.weekend.loop', 20, 'minutes', 'Typical showroom test-drive loop today', S.prog);
f('prog.retention.days', 90, 'days', 'Data retention period', S.prog);
f('prog.content.cost', 40000000, 'INR', 'Content, fact-checking and data-privacy team, per year', S.prog);
f('rival.buyback', null, undefined, 'Rival standard buyback programme', gap('whether each rival brand publishes a comparable assured-buyback programme'));
f('rival.repeatrepair', null, undefined, 'Rival repeat-repair loaner cover', gap('whether each rival brand publishes a comparable repeat-repair loaner commitment'));

// Evidence
f('ev.buyback.pct3', 60, '%', 'e Vitara assured buyback at 3 years / 45,000 km', team('Maruti Suzuki press release, Feb 2026, via Round 2 brief section 11.2'), { asOf: '2026-02' });
f('ev.buyback.pct4', 50, '%', 'e Vitara assured buyback at 4 years / 60,000 km', team('Maruti Suzuki press release, Feb 2026, via Round 2 brief section 11.2'), { asOf: '2026-02' });
f('ev.buyback.km4', 60000, 'km', 'e Vitara assured buyback, 4-year distance limit', team('Maruti Suzuki press release, Feb 2026, via Round 2 brief section 11.2'));
f('ev.buyback.years4', 4, 'years', 'e Vitara assured buyback, longer term', team('Maruti Suzuki press release, Feb 2026, via Round 2 brief section 11.2'));
f('gv.pilot.pct', 50, '%', 'Grand Vitara buyback pilot value', team('91wheels, Jun 2025, via Round 2 brief section 11.2'), { asOf: '2025-06' });
f('gv.pilot.years', 5, 'years', 'Grand Vitara buyback pilot term', team('91wheels, Jun 2025, via Round 2 brief section 11.2'));
f('gv.pilot.km', 75000, 'km', 'Grand Vitara buyback pilot distance', team('91wheels, Jun 2025, via Round 2 brief section 11.2'));
f('gv.pilot.metros', 3, 'metros', 'Grand Vitara buyback pilot cities', team('91wheels, Jun 2025, via Round 2 brief section 11.2'));
f('gv.pilot.date', 'June 2025', undefined, 'Grand Vitara buyback pilot date', team('91wheels, Jun 2025, via Round 2 brief section 11.2'));
f('resale.ratio', 1.04, 'x', 'Used-market price ratio, Grand Vitara to Hyryder', team('Team used-market sample, Sep 2026, via Round 2 brief section 11.2'), { asOf: '2026-09' });
f('resale.listings', 37, 'listings', 'NCR used-car listings in the sample', team('Team used-market sample, Sep 2026, via Round 2 brief section 11.2'));
f('resale.residual', 82, '%', 'Predicted 3-year / 45,000 km residual, Grand Vitara', team('Team resale regression, Sep 2026, via Round 2 brief section 11.2'), { asOf: '2026-09' });
f('sales.ratio', 4.5, 'x', 'Hyryder to Grand Vitara strong-hybrid sales, H1 2026', team('Round 2 brief, section 1 (diagnosis)'));
f('ai.audit.n', 3, 'assistants', 'AI assistants that framed Toyota as the premium pick', team('Team AI audit, via Round 2 brief section 1'));
f('service.touchpoints', 6000, 'touchpoints', 'Maruti Suzuki service touchpoints (more than)', team('MSIL, Jul 2026, via Round 2 brief section 11.2'), { asOf: '2026-07' });
f('hybrid.range', 1000, 'km', 'Strong hybrid claimed range per tank (more than)', { ...S.deck1, status: 'needs-verification' }, { note: 'The brief asks for re-verification. Tank 45 L x 27.97 km/l claimed = about 1,259 km, consistent with the claim.' });
f('vic.sales.units', 100000, 'units', 'Victoris sales', S.deck1);
f('vic.sales.months', 9, 'months', 'Victoris sales period (about)', S.deck1);
f('review.nexon.safety', 57, '%', 'Nexon owner reviews mentioning safety', team('Team review coding, via Round 2 brief section 11.2'));
f('review.brezza.safety', 17, '%', 'Brezza owner reviews mentioning safety', team('Team review coding, via Round 2 brief section 11.2'));
f('review.count', 634, 'reviews', 'Owner reviews coded', team('Round 2 brief, section 4'));
f('review.forum', 311, 'posts', 'Owner-forum posts coded', team('Round 2 brief, section 4'));
f('review.expert', 17, 'verdicts', 'Expert verdicts coded', team('Round 2 brief, section 4'));
f('gv.sh.owner.low', 20, 'km/l', 'Grand Vitara strong hybrid, owner-reported efficiency (low end)', team('Team coding of about 125 CarDekho owner reviews, Oct 2026'));
f('gv.sh.owner.high', 24, 'km/l', 'Grand Vitara strong hybrid, owner-reported efficiency (high end)', team('Team coding of about 125 CarDekho owner reviews, Oct 2026'));
f('cci.penalty', 2000000000, 'INR', 'CCI penalty on Maruti Suzuki for resale price maintenance', team('CCI order, Aug 2021, via Round 2 brief section 11.2'), { asOf: '2021-08' });
f('cci.date', 'August 2021', undefined, 'Date of the CCI order', team('CCI order, Aug 2021, via Round 2 brief section 11.2'));
f('gv.sh.battery.warranty', '8 years / 1,60,000 km', undefined, 'Grand Vitara strong-hybrid battery warranty', S.ctBat);
f('hy.sh.battery.warranty', null, undefined, 'Hyryder strong-hybrid battery warranty', gap('Toyota hybrid battery warranty terms, from toyotabharat.com'));
f('gv.tank', 45, 'l', 'Grand Vitara fuel tank', S.gvS);

// Organisation, rollout, economics
const org: [string, V, string, string][] = [
  ['score.total', 100, 'points', 'Dealer scorecard total'],
  ['score.leads.pts', 10, 'points', 'Scorecard: leads contacted within 24 hours'],
  ['score.leads.floor', 70, '%', 'Scorecard floor: leads contacted within 24 hours'],
  ['score.leads.target', 95, '%', 'Scorecard target: leads contacted within 24 hours'],
  ['score.leads.hours', 24, 'hours', 'Lead-contact window'],
  ['score.drive.pts', 15, 'points', 'Scorecard: drive to booking, indexed to region'],
  ['score.pledge.pts', 5, 'points', 'Scorecard: Service Pledge kept'],
  ['score.ftf.pts', 15, 'points', 'Scorecard: repairs fixed first time'],
  ['score.ntb.pts', 10, 'points', 'Scorecard: new-to-brand share of SUV bookings'],
  ['kpi.pair.floor', 40, '%', 'Guardrail: Grand Vitara share of the Victoris + Grand Vitara pair (at least)'],
  ['roll.pilot.cities', 5, 'cities', 'Pilot cities'],
  ['roll.pilot.outlets', 20, 'outlets', 'Pilot outlets'],
  ['roll.pilot.months', '0-6', '', 'Pilot timing, months'],
  ['roll.nexa.outlets', 740, 'outlets', 'NEXA national roll-out'],
  ['roll.nexa.months', '6-18', '', 'NEXA national timing, months'],
  ['roll.arena.outlets', 3100, 'outlets', 'Arena national roll-out (about)'],
  ['roll.arena.months', '12-30', '', 'Arena national timing, months'],
  ['roll.pods', 25, 'pods', 'Public kiosk pods in test'],
  ['roll.pods.months', '6-18', '', 'Public pod test timing, months'],
];
org.forEach(([id, v, u, l]) => f(id, v, u || undefined, l, S.org));
const econ: [string, number, string, string][] = [
  ['econ.hardware', 110000, 'INR', 'Kiosk hardware per outlet, paid by the dealer'],
  ['econ.sessions', 300, 'sessions', 'Sessions per kiosk per month (about)'],
  ['econ.ai', 3, 'INR', 'Answer-engine cost per session (about)'],
  ['econ.run', 16800, 'INR', 'Maruti Suzuki running cost per kiosk per year (about)'],
  ['econ.total', 104500000, 'INR', 'Running cost per year at full roll-out, including the content team (about)'],
  ['econ.build', 80000000, 'INR', 'One-time platform build'],
];
econ.forEach(([id, v, u, l]) => f(id, v, u, l, S.wb));
f('prior.arena.year', '2017', undefined, 'Arena launched with interactive product touchscreens', team('Round 2 brief, section 1 (prior art)'));
f('prior.nexa.year', '2020', undefined, 'NEXA AR showroom', team('Round 2 brief, section 1 (prior art)'));
f('mpv.ertiga.seats', 7, 'seats', 'Ertiga seating', S.mpv);
f('mpv.xl6.seats', 6, 'seats', 'XL6 seating', S.mpv);
f('mpv.invicto.seats', null, 'seats', 'Invicto seating', gap('Invicto seating layouts, from nexaexperience.com'));

// ---------- Models and variants ----------
type Fuel = 'petrol' | 'cng' | 'hybrid' | 'ev' | 'diesel';
interface Variant { id: string; name: string; fuel: Fuel; transmission: string; drive: 'FWD' | 'AWD' | '4WD'; auto: boolean; role: string;
  facts: Record<'price' | 'powertrain' | 'power' | 'torque' | 'efficiency' | 'adas' | 'boot' | 'range', string | null> }
interface Model { id: string; brand: string; name: string; channel: 'nexa' | 'arena' | null; segment: string; silhouette: string; seats: number;
  tags: string[]; resaleEvidence: boolean; facts: Record<string, string | null>; variants: Variant[] }

interface VIn { id: string; name: string; fuel: Fuel; tr: string; drive?: 'FWD' | 'AWD' | '4WD'; role: string; price: number; pt: string;
  power?: [number, string, Src]; torque?: [number, Src]; eff?: [number, string, Src] | null; adas?: [string, number, Src] | null; boot?: string | null; range?: [number, Src] }
function mk(model: string, priceSrc: Src, list: VIn[]): Variant[] {
  return list.map((v) => {
    const id = `${model}.${v.id}`;
    const full = `${model} ${v.name}`;
    return {
      id, name: v.name, fuel: v.fuel, transmission: v.tr, drive: v.drive ?? 'FWD', auto: v.tr !== 'Manual', role: v.role,
      facts: {
        price: f(`${id}.price`, v.price, 'INR', `${full}, ex-showroom New Delhi`, priceSrc),
        powertrain: f(`${id}.pt`, v.pt, undefined, `${full}, powertrain`, priceSrc, { note: 'Fuel and gearbox read from the variant name on the price page; engine size from the model specification sources.' }),
        power: v.power ? f(`${id}.power`, v.power[0], v.power[1], `${full}, maximum power`, v.power[2]) : f(`${id}.power`, null, 'PS', `${full}, maximum power`, gap(`${full}: power`)),
        torque: v.torque ? f(`${id}.torque`, v.torque[0], 'Nm', `${full}, maximum torque`, v.torque[1]) : f(`${id}.torque`, null, 'Nm', `${full}, maximum torque`, gap(`${full}: torque`)),
        efficiency: v.eff ? f(`${id}.eff`, v.eff[0], v.eff[1], `${full}, claimed efficiency`, v.eff[2]) : v.fuel === 'ev' ? null : f(`${id}.eff`, null, 'km/l', `${full}, claimed efficiency`, gap(`${full}: claimed efficiency`)),
        adas: v.adas ? f(`${id}.adas`, v.adas[0], undefined, `${full}, driver assistance`, v.adas[2], { cmp: v.adas[1] }) : f(`${id}.adas`, null, undefined, `${full}, driver assistance`, gap(`${full}: ADAS availability on this variant`)),
        boot: v.boot ?? null,
        range: v.range ? f(`${id}.range`, v.range[0], 'km', `${full}, claimed range`, v.range[1]) : null,
      },
    };
  });
}
const crash = (id: string, text: string, stars: number, src: Src, extra: Partial<Fact> = {}) => f(`${id}.crash`, text, undefined, `${id} crash rating`, src, { cmp: stars, ...extra });
const unrated = (id: string) => crash(id, 'No Bharat NCAP rating published', 0, S.bncap, { verifiedAbsent: true, asOf: '2026-09-16', note: 'Not in the list of every car Bharat NCAP had tested as of 16 Sep 2026.' });

const SH_PT = '1.5 L strong hybrid, e-CVT';
const shPower: [number, string, Src] = [114, 'bhp', S.gvS];
const k15: [number, string, Src] = [103, 'PS', S.acGv];
const cngP: [number, string, Src] = [88, 'PS', S.gvCng];

const models: Model[] = [];
const rivals: Model[] = [];

// Grand Vitara
const gvBootSh = f('gv.boot.sh', null, 'l', 'Grand Vitara strong hybrid, boot', gap('Grand Vitara strong-hybrid boot capacity (the battery reduces it)'));
models.push({
  id: 'gv', brand: 'Maruti Suzuki', name: 'Grand Vitara', channel: 'nexa', segment: 'midsize', silhouette: 'midsize', seats: 5,
  tags: ['design', 'hybrid'], resaleEvidence: true,
  facts: {
    builtAt: f('gv.built', "Toyota Kirloskar's Bidadi plant", undefined, 'Grand Vitara, built at', S.brief),
    airbags: f('gv.airbags', 6, 'airbags', 'Grand Vitara, airbags (standard)', S.brief),
    crash: unrated('gv'),
    boot: f('gv.boot', 373, 'l', 'Grand Vitara, boot (petrol)', S.acGv),
    groundClearance: f('gv.gc', 210, 'mm', 'Grand Vitara, ground clearance', S.gvS),
    warranty: W_MSIL,
  },
  variants: mk('gv', S.gvP, [
    { id: 'sigma', name: 'Sigma', fuel: 'petrol', tr: 'Manual', role: 'entry', price: 1076500, pt: '1.5 L petrol, manual', power: k15, torque: [137, S.acGv], eff: [21.11, 'km/l', S.acGv], adas: ['None listed', 0, { ...S.gvS, status: 'needs-verification' }] },
    { id: 'delta-at', name: 'Delta AT', fuel: 'petrol', tr: 'Automatic', role: 'auto', price: 1349700, pt: '1.5 L petrol, automatic', power: k15, torque: [137, S.acGv], eff: [20.58, 'km/l', S.acGv], adas: ['None listed', 0, { ...S.gvS, status: 'needs-verification' }] },
    { id: 'delta-cng', name: 'Delta CNG', fuel: 'cng', tr: 'Manual', role: 'cng', price: 1304700, pt: '1.5 L petrol + CNG, manual', power: cngP, torque: [121.5, S.gvCng], eff: [26.6, 'km/kg', S.gvCng], adas: ['None listed', 0, { ...S.gvS, status: 'needs-verification' }] },
    { id: 'alpha-awd', name: 'Alpha AWD AT', fuel: 'petrol', tr: 'Automatic', drive: 'AWD', role: 'awd', price: 1804700, pt: '1.5 L petrol, automatic, ALLGRIP AWD', power: k15, torque: [137, S.acGv], eff: [19.38, 'km/l', S.acGv], adas: ['None listed', 0, { ...S.gvS, status: 'needs-verification' }] },
    { id: 'deltaplus-sh', name: 'Delta Plus Strong Hybrid', fuel: 'hybrid', tr: 'e-CVT', role: 'hybrid-base', price: 1668300, pt: SH_PT, power: shPower, torque: [141, S.gvS], eff: [27.97, 'km/l', S.gvS], adas: ['None listed', 0, { ...S.gvS, status: 'needs-verification' }], boot: gvBootSh },
    { id: 'alphaplus-sh', name: 'Alpha Plus (O) Strong Hybrid', fuel: 'hybrid', tr: 'e-CVT', role: 'hybrid-top', price: 1962000, pt: SH_PT, power: shPower, torque: [141, S.gvS], eff: [27.97, 'km/l', S.gvS], adas: ['None listed', 0, { ...S.gvS, status: 'needs-verification' }], boot: gvBootSh },
  ]),
});

// Victoris
const vicAdas: [string, number, Src] = ['Level 2', 2, { ...S.deck1, source: 'Team research (Round 1 deck); CarDekho specifications list adaptive cruise, lane keep assist and emergency braking' }];
const vicLow: [string, number, Src] = ['Not on this variant', 0, gap('Victoris: which variants carry Level 2 ADAS')];
models.push({
  id: 'vic', brand: 'Maruti Suzuki', name: 'Victoris', channel: 'arena', segment: 'midsize', silhouette: 'midsize', seats: 5,
  tags: ['family', 'safety', 'cng'], resaleEvidence: false,
  facts: {
    builtAt: f('vic.built', null, undefined, 'Victoris, built at', gap('Victoris manufacturing plant')),
    airbags: f('vic.airbags', 6, 'airbags', 'Victoris, airbags (standard)', S.vicS),
    crash: crash('vic', '5 stars, Bharat NCAP (Sep 2025) and Global NCAP', 5, S.bncap, { note: 'Bharat NCAP adult 31.66 / 32, child 43 / 49. Global NCAP 5 stars per CarDekho specifications and the Round 1 deck.' }),
    boot: f('vic.boot', null, 'l', 'Victoris, boot', gap('Victoris boot capacity: sources give 373 l and about 439 l')),
    groundClearance: f('vic.gc', 210, 'mm', 'Victoris, ground clearance (unladen)', web('Bajaj Finserv, Victoris ground clearance, 18 Sep 2025', 'https://www.bajajfinserv.in/maruti-suzuki-victoris-ground-clearance', 'needs-verification')),
    warranty: W_MSIL_O,
  },
  variants: mk('vic', S.vicP, [
    { id: 'lxi', name: 'LXI', fuel: 'petrol', tr: 'Manual', role: 'entry', price: 1049900, pt: '1.5 L petrol, manual', power: [103, 'PS', S.rlVic], torque: [139, S.rlVic], eff: [21.18, 'km/l', S.rlVic], adas: vicLow },
    { id: 'vxi-at', name: 'VXI AT', fuel: 'petrol', tr: 'Automatic', role: 'auto', price: 1340900, pt: '1.5 L petrol, automatic', power: [103, 'PS', S.rlVic], torque: [139, S.rlVic], eff: [21.06, 'km/l', S.rlVic], adas: vicLow },
    { id: 'vxi-cng', name: 'VXI CNG', fuel: 'cng', tr: 'Manual', role: 'cng', price: 1289900, pt: '1.5 L petrol + CNG, manual, underbody tank', power: [87.8, 'PS', S.rlVic], torque: [121.5, S.rlVic], eff: [27.02, 'km/kg', S.rlVic], adas: vicLow },
    { id: 'zxiplus-awd', name: 'ZXI Plus AT AWD', fuel: 'petrol', tr: 'Automatic', drive: 'AWD', role: 'awd', price: 1868900, pt: '1.5 L petrol, automatic, ALLGRIP AWD', power: [103, 'PS', S.rlVic], torque: [139, S.rlVic], eff: [19.07, 'km/l', S.rlVic], adas: vicAdas },
    { id: 'vxi-sh', name: 'VXI Strong Hybrid', fuel: 'hybrid', tr: 'e-CVT', role: 'hybrid-base', price: 1642900, pt: SH_PT, power: [114, 'bhp', S.vicS], torque: [141, S.vicS], eff: [28.65, 'km/l', S.vicS], adas: vicLow },
    { id: 'zxiplus-sh', name: 'ZXI Plus (O) Strong Hybrid', fuel: 'hybrid', tr: 'e-CVT', role: 'hybrid-top', price: 1998900, pt: SH_PT, power: [114, 'bhp', S.vicS], torque: [141, S.vicS], eff: [28.65, 'km/l', S.vicS], adas: vicAdas },
  ]),
});

// Brezza (2026 facelift)
const brzAdas = null;
models.push({
  id: 'brz', brand: 'Maruti Suzuki', name: 'Brezza', channel: 'arena', segment: 'compact', silhouette: 'compact', seats: 5,
  tags: ['family', 'safety', 'cng'], resaleEvidence: false,
  facts: {
    builtAt: null,
    airbags: f('brz.airbags', 6, 'airbags', 'Brezza, airbags (standard)', S.brzL),
    crash: crash('brz', '5 stars, Bharat NCAP (Jun 2026)', 5, S.bncap, { note: 'Adult 30.41 / 32, child 43 / 49. Applies to the 2026 facelift.' }),
    boot: f('brz.boot', null, 'l', 'Brezza, boot', gap('2026 Brezza boot capacity')),
    groundClearance: f('brz.gc', null, 'mm', 'Brezza, ground clearance', gap('2026 Brezza ground clearance')),
    warranty: W_MSIL_O,
  },
  variants: mk('brz', S.brzP, [
    { id: 'lxi-turbo', name: 'LXi Turbo', fuel: 'petrol', tr: 'Manual', role: 'entry', price: 749900, pt: '1.0 L turbo petrol, manual', power: [110, 'PS', S.brzL], torque: [170, S.brzL], eff: [20.47, 'km/l', S.brzM], adas: brzAdas },
    { id: 'vxi', name: 'VXi', fuel: 'petrol', tr: 'Manual', role: 'mid', price: 930900, pt: '1.5 L petrol, manual', power: [103, 'PS', S.brzL], torque: [139, S.brzL], eff: [21.09, 'km/l', S.brzM], adas: brzAdas },
    { id: 'lxi-cng', name: 'LXi CNG', fuel: 'cng', tr: 'Manual', role: 'cng', price: 939900, pt: '1.5 L petrol + CNG, manual, underbody tank', power: [88, 'PS', S.brzL], torque: [121.5, S.brzL], eff: [26.9, 'km/kg', S.brzM], adas: brzAdas },
    { id: 'vxi-at', name: 'VXi AT', fuel: 'petrol', tr: 'Automatic', role: 'auto', price: 1060900, pt: '1.5 L petrol, automatic', power: [103, 'PS', S.brzL], torque: [139, S.brzL], eff: [20.17, 'km/l', S.brzM], adas: brzAdas },
    { id: 'zxiplus-at', name: 'ZXi Plus AT', fuel: 'petrol', tr: 'Automatic', role: 'top', price: 1354900, pt: '1.5 L petrol, automatic', power: [103, 'PS', S.brzL], torque: [139, S.brzL], eff: [20.17, 'km/l', S.brzM], adas: brzAdas },
  ]),
});

// Fronx
models.push({
  id: 'frx', brand: 'Maruti Suzuki', name: 'Fronx', channel: 'nexa', segment: 'compact', silhouette: 'compact', seats: 5,
  tags: ['design'], resaleEvidence: false,
  facts: {
    builtAt: null,
    airbags: f('frx.airbags', null, 'airbags', 'Fronx, airbags (standard)', gap('Fronx standard airbag count: sources give two and six')),
    crash: unrated('frx'),
    boot: f('frx.boot', 308, 'l', 'Fronx, boot', S.frxS),
    groundClearance: f('frx.gc', 190, 'mm', 'Fronx, ground clearance', S.frxS),
    warranty: W_MSIL_O,
  },
  variants: mk('frx', S.frxP, [
    { id: 'sigma', name: 'Sigma', fuel: 'petrol', tr: 'Manual', role: 'entry', price: 689900, pt: '1.2 L petrol, manual', power: [90, 'PS', S.frxB], torque: [113, S.frxB], eff: [21.79, 'km/l', S.frxB] },
    { id: 'deltaplus-amt', name: 'Delta Plus AMT', fuel: 'petrol', tr: 'Automatic', role: 'auto', price: 864500, pt: '1.2 L petrol, automated manual', power: [90, 'PS', S.frxB], torque: [113, S.frxB], eff: [22.89, 'km/l', S.frxB] },
    { id: 'delta-cng', name: 'Delta CNG', fuel: 'cng', tr: 'Manual', role: 'cng', price: 873900, pt: '1.2 L petrol + CNG, manual', power: [76, 'bhp', S.frxB], torque: [98.5, S.frxB], eff: [28.51, 'km/kg', S.frxB] },
    { id: 'alpha-turbo-at', name: 'Alpha Turbo AT', fuel: 'petrol', tr: 'Automatic', role: 'top', price: 1188900, pt: '1.0 L turbo petrol, automatic', power: [100, 'PS', S.frxB], torque: [148, S.frxB], eff: [20.01, 'km/l', { ...S.frxB, status: 'needs-verification' }] },
  ]),
});

// e Vitara
const evAdas: [string, number, Src] = ['Level 2', 2, S.brief];
models.push({
  id: 'ev', brand: 'Maruti Suzuki', name: 'e Vitara', channel: 'nexa', segment: 'midsize', silhouette: 'midsize', seats: 5,
  tags: ['design', 'ev'], resaleEvidence: false,
  facts: {
    builtAt: null,
    airbags: f('ev.airbags', 7, 'airbags', 'e Vitara, airbags', web('MeraEV, e Vitara listing', 'https://www.meraev.com/ev-price/maruti-suzuki-e-vitara', 'needs-verification')),
    crash: crash('ev', '5 stars, Bharat NCAP (Dec 2025)', 5, S.bncap, { note: 'Adult 31.49 / 32, child 43 / 49.' }),
    boot: f('ev.boot', null, 'l', 'e Vitara, boot', gap('e Vitara boot capacity')),
    groundClearance: f('ev.gc', null, 'mm', 'e Vitara, ground clearance', gap('e Vitara ground clearance')),
    warranty: W_MSIL_O,
  },
  variants: mk('ev', S.evP, [
    { id: 'delta', name: 'Delta', fuel: 'ev', tr: 'Single-speed', role: 'entry', price: 1619000, pt: '49 kWh battery, front motor', power: [144, 'PS', S.evT], torque: [192.5, S.evT], adas: evAdas, range: [440, S.evP] },
    { id: 'zeta', name: 'Zeta', fuel: 'ev', tr: 'Single-speed', role: 'mid', price: 1794000, pt: '61 kWh battery, front motor', power: [174, 'PS', { ...S.evT, status: 'needs-verification' }], torque: [192.5, S.evT], adas: evAdas, range: [543, S.evP] },
    { id: 'alpha', name: 'Alpha', fuel: 'ev', tr: 'Single-speed', role: 'top', price: 2021000, pt: '61 kWh battery, front motor', power: [174, 'PS', { ...S.evT, status: 'needs-verification' }], torque: [192.5, S.evT], adas: evAdas, range: [543, S.evP] },
  ]),
});
f('ev.consumption', null, 'kWh/100 km', 'e Vitara energy consumption', gap('a published e Vitara consumption figure; without it the EV is left out of cost comparisons'));

// Jimny
models.push({
  id: 'jim', brand: 'Maruti Suzuki', name: 'Jimny', channel: 'nexa', segment: 'offroader', silhouette: 'offroader', seats: 4,
  tags: ['capability'], resaleEvidence: false,
  facts: {
    builtAt: null,
    airbags: f('jim.airbags', 6, 'airbags', 'Jimny, airbags', S.jimS),
    crash: unrated('jim'),
    boot: f('jim.boot', 208, 'l', 'Jimny, boot', { ...S.jimS, status: 'needs-verification' }, { note: 'Sources give 208, 211 and 219 litres.' }),
    groundClearance: f('jim.gc', 210, 'mm', 'Jimny, ground clearance', S.jimS),
    warranty: W_MSIL_O,
  },
  variants: mk('jim', S.jimP, [
    { id: 'zeta', name: 'Zeta', fuel: 'petrol', tr: 'Manual', drive: '4WD', role: 'entry', price: 1259000, pt: '1.5 L petrol, manual, ALLGRIP PRO 4WD', power: [104.8, 'bhp', S.jimS], torque: [134.2, S.jimS], eff: [16.94, 'km/l', S.jimS] },
    { id: 'alpha-at', name: 'Alpha AT', fuel: 'petrol', tr: 'Automatic', drive: '4WD', role: 'top', price: 1451700, pt: '1.5 L petrol, automatic, ALLGRIP PRO 4WD', power: [104.8, 'bhp', S.jimS], torque: [134.2, S.jimS], eff: [16.39, 'km/l', S.jimS] },
  ]),
});

// ---------- Rivals ----------
const hySh: [number, string, Src] = [114, 'bhp', { ...S.brief, source: 'Team research: same 1.5 strong-hybrid powertrain as the Grand Vitara (CarDekho lists the engine alone at 91.18 bhp)' }];
rivals.push({
  id: 'hy', brand: 'Toyota', name: 'Urban Cruiser Hyryder', channel: null, segment: 'midsize', silhouette: 'midsize', seats: 5, tags: [], resaleEvidence: true,
  facts: {
    builtAt: f('hy.built', "Toyota Kirloskar's Bidadi plant", undefined, 'Hyryder, built at', S.brief),
    airbags: f('hy.airbags', 6, 'airbags', 'Hyryder, airbags', S.hyS),
    crash: unrated('hy'),
    boot: f('hy.boot', null, 'l', 'Hyryder, boot', gap('Hyryder boot capacity: the specification page shows 273 l and a reported 373 l')),
    groundClearance: f('hy.gc', null, 'mm', 'Hyryder, ground clearance', gap('Hyryder ground clearance')),
    warranty: W_HY,
  },
  variants: mk('hy', S.hyP, [
    { id: 'e', name: 'E', fuel: 'petrol', tr: 'Manual', role: 'entry', price: 1131000, pt: '1.5 L petrol, manual' },
    { id: 's-at', name: 'S AT', fuel: 'petrol', tr: 'Automatic', role: 'auto', price: 1417000, pt: '1.5 L petrol, automatic' },
    { id: 's-cng', name: 'S CNG', fuel: 'cng', tr: 'Manual', role: 'cng', price: 1371000, pt: '1.5 L petrol + CNG, manual' },
    { id: 'v-awd', name: 'V AWD AT', fuel: 'petrol', tr: 'Automatic', drive: 'AWD', role: 'awd', price: 1872000, pt: '1.5 L petrol, automatic, AWD' },
    { id: 's-sh', name: 'S Hybrid', fuel: 'hybrid', tr: 'e-CVT', role: 'hybrid-base', price: 1718000, pt: SH_PT, power: hySh, torque: [141, hySh[2]], eff: [27.97, 'km/l', S.hyS] },
    { id: 'v-sh', name: 'V Hybrid', fuel: 'hybrid', tr: 'e-CVT', role: 'hybrid-top', price: 1999000, pt: SH_PT, power: hySh, torque: [141, hySh[2]], eff: [27.97, 'km/l', S.hyS] },
  ]),
});

const crAdasTop: [string, number, Src] = ['Level 2', 2, S.acCr];
const mpi: [number, string, Src] = [115, 'PS', S.acCr];
rivals.push({
  id: 'cr', brand: 'Hyundai', name: 'Creta', channel: null, segment: 'midsize', silhouette: 'midsize', seats: 5, tags: [], resaleEvidence: false,
  facts: {
    builtAt: null,
    airbags: f('cr.airbags', 6, 'airbags', 'Creta, airbags (standard)', S.crS),
    crash: unrated('cr'),
    boot: f('cr.boot', 433, 'l', 'Creta, boot', S.crS),
    groundClearance: f('cr.gc', 190, 'mm', 'Creta, ground clearance', S.acCr),
    warranty: f('cr.warranty', '3 years / unlimited km', undefined, 'Creta standard warranty', S.acCr, { cmp: 1e9 }),
  },
  variants: mk('cr', S.crP, [
    { id: 'e', name: 'E', fuel: 'petrol', tr: 'Manual', role: 'entry', price: 1090700, pt: '1.5 L petrol, manual', power: mpi, torque: [143.8, S.acCr], eff: [17.4, 'km/l', { ...S.crS, status: 'needs-verification' }] },
    { id: 'exo-ivt', name: 'EX (O) iVT', fuel: 'petrol', tr: 'Automatic', role: 'auto', price: 1449700, pt: '1.5 L petrol, CVT automatic', power: mpi, torque: [143.8, S.acCr], eff: [17.7, 'km/l', S.brief] },
    { id: 'king-ivt', name: 'King iVT', fuel: 'petrol', tr: 'Automatic', role: 'top', price: 1868800, pt: '1.5 L petrol, CVT automatic', power: mpi, torque: [143.8, S.acCr], eff: [17.7, 'km/l', S.brief], adas: crAdasTop },
    { id: 'king-turbo', name: 'King Turbo DCT', fuel: 'petrol', tr: 'Automatic', role: 'turbo', price: 1991300, pt: '1.5 L turbo petrol, dual-clutch automatic', power: [160, 'PS', S.acCr], torque: [253, S.acCr], adas: crAdasTop },
    { id: 'king-d-at', name: 'King Diesel AT', fuel: 'diesel', tr: 'Automatic', role: 'diesel', price: 1980800, pt: '1.5 L diesel, automatic', power: [116, 'PS', S.acCr], torque: [250, S.acCr], eff: [19.1, 'km/l', S.crS], adas: crAdasTop },
  ]),
});

const selAdas: [string, number, Src] = ['Level 2', 2, { ...S.acSel, status: 'needs-verification' }];
rivals.push({
  id: 'sel', brand: 'Kia', name: 'Seltos', channel: null, segment: 'midsize', silhouette: 'midsize', seats: 5, tags: [], resaleEvidence: false,
  facts: {
    builtAt: null,
    airbags: f('sel.airbags', 6, 'airbags', 'Seltos, airbags (standard)', S.selS),
    crash: crash('sel', '5 stars, Bharat NCAP (Mar 2026)', 5, S.bncap, { note: 'Adult 31.70 / 32, child 45 / 49.' }),
    boot: f('sel.boot', 447, 'l', 'Seltos, boot', { ...S.selS, status: 'needs-verification' }, { note: 'CarDekho lists 447 l; Autocar India gives 433 l in one place and 447 l in another.' }),
    groundClearance: f('sel.gc', 190, 'mm', 'Seltos, ground clearance', S.acSel),
    warranty: f('sel.warranty', null, undefined, 'Seltos standard warranty', gap('Kia Seltos standard warranty terms, from kia.com/in')),
  },
  variants: mk('sel', S.selP, [
    { id: 'hte', name: 'HTE', fuel: 'petrol', tr: 'Manual', role: 'entry', price: 1099901, pt: '1.5 L petrol, manual', power: [115, 'PS', S.acSel], eff: [16.5, 'km/l', { ...S.acSel, status: 'needs-verification' }] },
    { id: 'htk-ivt', name: 'HTK iVT', fuel: 'petrol', tr: 'Automatic', role: 'auto', price: 1471901, pt: '1.5 L petrol, CVT automatic', power: [115, 'PS', S.acSel], eff: [16.5, 'km/l', { ...S.acSel, status: 'needs-verification' }] },
    { id: 'gtx-ivt', name: 'GTX iVT', fuel: 'petrol', tr: 'Automatic', role: 'top', price: 1871901, pt: '1.5 L petrol, CVT automatic', power: [115, 'PS', S.acSel], eff: [16.5, 'km/l', { ...S.acSel, status: 'needs-verification' }], adas: selAdas },
    { id: 'gtxa-turbo', name: 'GTX (A) Turbo DCT', fuel: 'petrol', tr: 'Automatic', role: 'turbo', price: 1999901, pt: '1.5 L turbo petrol, dual-clutch automatic', power: [160, 'PS', S.acSel], torque: [253, S.acSel], eff: [17.5, 'km/l', { ...S.acSel, status: 'needs-verification' }], adas: selAdas },
    { id: 'gtx-d-at', name: 'GTX Diesel AT', fuel: 'diesel', tr: 'Automatic', role: 'diesel', price: 1999901, pt: '1.5 L diesel, automatic', power: [116, 'PS', S.acSel], torque: [250, S.acSel], eff: [17.8, 'km/l', { ...S.acSel, status: 'needs-verification' }], adas: selAdas },
  ]),
});

const rev: [number, string, Src] = [120, 'PS', S.acNx];
const nxCngBoot = f('nx.boot.cng', 321, 'l', 'Nexon CNG, boot', S.acNx);
rivals.push({
  id: 'nx', brand: 'Tata', name: 'Nexon', channel: null, segment: 'compact', silhouette: 'compact', seats: 5, tags: [], resaleEvidence: false,
  facts: {
    builtAt: null,
    airbags: f('nx.airbags', 6, 'airbags', 'Nexon, airbags (standard)', S.acNx),
    crash: crash('nx', '5 stars, Bharat NCAP (Oct 2024) and Global NCAP', 5, S.bncap, { note: 'Bharat NCAP adult 29.41 / 32, child 43.83 / 49. Global NCAP 5 stars per Autocar India.' }),
    boot: f('nx.boot', 382, 'l', 'Nexon, boot', S.acNx),
    groundClearance: f('nx.gc', 208, 'mm', 'Nexon, ground clearance', S.acNx),
    warranty: f('nx.warranty', '3 years / 1,00,000 km', undefined, 'Nexon standard warranty', S.acNx, { cmp: 100000 }),
  },
  variants: mk('nx', S.nxP, [
    { id: 'smart', name: 'Smart', fuel: 'petrol', tr: 'Manual', role: 'entry', price: 739990, pt: '1.2 L turbo petrol, manual', power: rev, torque: [170, S.acNx], eff: [17.44, 'km/l', S.acNx] },
    { id: 'pureplus-amt', name: 'Pure Plus AMT', fuel: 'petrol', tr: 'Automatic', role: 'auto', price: 971990, pt: '1.2 L turbo petrol, automated manual', power: rev, torque: [170, S.acNx], eff: [17.18, 'km/l', S.acNx] },
    { id: 'smartplus-cng', name: 'Smart Plus CNG', fuel: 'cng', tr: 'Manual', role: 'cng', price: 926990, pt: '1.2 L turbo petrol + CNG, manual', power: [100, 'PS', S.acNx], torque: [170, S.acNx], eff: [24, 'km/kg', S.acNx], boot: nxCngBoot },
    { id: 'creative-dca', name: 'Creative DCA', fuel: 'petrol', tr: 'Automatic', role: 'top', price: 1141990, pt: '1.2 L turbo petrol, dual-clutch automatic', power: rev, torque: [170, S.acNx], eff: [17.01, 'km/l', S.acNx] },
  ]),
});

const here = dirname(fileURLToPath(import.meta.url));
const out = (name: string, data: unknown) => writeFileSync(join(here, '..', 'src', 'data', name), JSON.stringify(data, null, 1) + '\n');
out('facts.json', facts);
out('models.json', models);
out('rivals.json', {
  shortlist: { nexa: ['hy', 'cr', 'sel'], arena: ['nx', 'cr', 'hy'], pod: ['hy', 'cr', 'sel'] },
  mpvs: [
    { id: 'ertiga', name: 'Ertiga', channel: 'arena', seats: 'mpv.ertiga.seats' },
    { id: 'xl6', name: 'XL6', channel: 'nexa', seats: 'mpv.xl6.seats' },
    { id: 'invicto', name: 'Invicto', channel: 'nexa', seats: 'mpv.invicto.seats' },
  ],
  models: rivals,
});
console.log(`facts: ${facts.length}, models: ${models.length}, rivals: ${rivals.length}`);
