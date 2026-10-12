import { useEffect, useMemo, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { ArrowRight, CalendarCheck, Delete, Minus, Plus, QrCode, Smartphone, UserRound } from 'lucide-react';
import { RIVALS, SHORTLIST, type Model, type Variant } from '../../data';
import { buildRows, honestRead, isTwinPair, type Cell, type Row, type RowKey } from '../../domain/compare';
import { carCost, costSeries, ownerEfficiency, payBack, type CarCost } from '../../domain/costs';
import { canSend, isValidPhone } from '../../domain/payload';
import { ask, intentById, suggestions } from '../../domain/qa';
import { factIdsIn } from '../../domain/template';
import type { AskedQuestion, FuelPrices, HandoffMode } from '../../domain/types';
import type { CompareGroup, PromiseTab } from '../../state/kioskMachine';
import { Better, Calc, Fact, Proposed, T, Tpl, Ui, UiMoney, Verify, calcText, copyOf, useLang, usePop, useText, type SlotValue } from '../../ui/core';
import { SIBLING, useKiosk, type Kiosk } from './context';
import { CarHead, Opt, RowList } from './screensA';

// ---------- Compare ----------
const GROUPS: Record<CompareGroup, RowKey[]> = {
  running: ['price', 'efficiency', 'per1000', 'warranty'],
  basics: ['builtAt', 'powertrain', 'power', 'torque'],
  safety: ['crash', 'airbags', 'adas', 'boot', 'gc'],
  ownership: ['buyback', 'repeatRepair'],
};
export function CellView({ c, plain }: { c: Cell; plain?: boolean }) {
  if ('fact' in c) return <Fact id={c.fact} plain={plain} />;
  if ('calc' in c) return <Calc v={c.calc} plain={plain} />;
  if ('verify' in c) return <Verify what={c.verify} plain={plain} />;
  return null;
}
export function RowView({ r, plain }: { r: Row; plain?: boolean }) {
  return (
    <tr data-row={r.key}>
      <th scope="row"><T k={`row.${r.key}`} />{r.proposed && <> <Proposed plain={plain} /></>}</th>
      <td className={r.better === 'a' ? 'is-better' : ''}><CellView c={r.a} plain={plain} />{r.better === 'a' && <Better />}</td>
      <td className={r.better === 'b' ? 'is-better' : ''}><CellView c={r.b} plain={plain} />{r.better === 'b' && <Better />}</td>
    </tr>
  );
}
export function HonestRead({ rows, ours, theirs }: { rows: Row[]; ours: string; theirs: string }) {
  const read = honestRead(rows);
  return (
    <div className="honest" data-testid="honest">
      <h2><T k="cmp.honest.title" /></h2>
      <p>
        <span data-testid="honest-theirs">{read.theirs.length ? <T k="cmp.honest.theirs" p={{ rival: theirs, rows: <RowList keys={read.theirs} /> }} /> : <T k="cmp.honest.none.theirs" p={{ rival: theirs }} />}</span>{' '}
        <span>{read.ours.length ? <T k="cmp.honest.ours" p={{ ours, rows: <RowList keys={read.ours} /> }} /> : <T k="cmp.honest.none.ours" p={{ ours }} />}</span>{' '}
        {read.gaps > 0 && <span><T k="cmp.honest.gaps" p={{ count: { ui: read.gaps } }} /> </span>}
        <span><T k="cmp.honest.proposed" /></span>
      </p>
    </div>
  );
}
export function TwinPanel() {
  return (
    <div className="twin" data-testid="twin">
      <h2><T k="twin.title" /></h2>
      <ul>{['plant', 'pt', 'warranty', 'resale'].map((k) => <li key={k}><T k={`twin.${k}`} /></li>)}</ul>
      <p className="note"><T k="twin.ai" /></p>
    </div>
  );
}

function VariantPicker({ model, current, onPick }: { model: Model; current: string; onPick: (id: string) => void }) {
  return (
    <div className="opts">
      {model.variants.map((v) => <Opt key={v.id} on={v.id === current} onClick={() => onPick(v.id)} title={v.name} desc={<><Fact id={v.facts.powertrain} plain /> · <Fact id={v.facts.price} plain /></>} testid={`variant-${v.id}`} />)}
    </div>
  );
}

export function Compare() {
  const { s, send, pick, target, prices, rec } = useKiosk();
  const pop = usePop();
  const lang = useLang();
  const rows = useMemo(() => (pick && target ? buildRows(pick.variant.id, target.variant.id, prices) : []), [pick, target, prices]);
  if (!pick) return null;
  const options = [...new Set([...s.answers.shortlist, ...(s.rivalId && s.rivalId !== SIBLING ? [s.rivalId] : [])])];
  const hasSibling = s.sibling || Boolean(rec.alternative);
  const choose = (title: string, model: Model, current: string, onPick: (id: string) => void) =>
    pop.open({ title, body: <VariantPicker model={model} current={current} onPick={(id) => { onPick(id); pop.close(); }} /> });
  if (!target) {
    return (
      <div className="screen">
        <div className="display"><h1><T k="cmp.noRival.title" /></h1><p className="lede"><T k="cmp.noRival.body" /></p><CarHead model={pick.model} variant={pick.variant} tag={<T k="cmp.ours" />} /></div>
        <div className="reach"><div className="opts">
          {SHORTLIST[s.channel].map((id) => { const m = RIVALS.find((r) => r.id === id)!; return <Opt key={id} onClick={() => send({ type: 'SET_RIVAL', rivalId: id })} title={`${m.brand} ${m.name}`} desc={<T k={`sl.${id}.desc`} />} testid={`add-${id}`} />; })}
          <Opt onClick={() => send({ type: 'SET_RIVAL', rivalId: SIBLING, sibling: true })} title={<T k="sl.sibling" />} desc={<T k="sl.sibling.desc" />} testid="add-sibling" />
        </div></div>
      </div>
    );
  }
  const twin = isTwinPair(pick.variant.id, target.variant.id);
  const groups: CompareGroup[] = ['running', 'basics', 'safety', 'ownership'];
  const shown = rows.filter((r) => GROUPS[s.group].includes(r.key)).sort((a, b) => GROUPS[s.group].indexOf(a.key) - GROUPS[s.group].indexOf(b.key));
  return (
    <div className="screen screen-compare">
      <div className="display">
        <div className="versus">
          <CarHead model={pick.model} variant={pick.variant} tag={<T k="cmp.ours" />} />
          <CarHead model={target.model} variant={target.variant} tag={<T k={target.sibling ? 'cmp.sibling' : 'cmp.theirs'} />} />
        </div>
        <p className="rule" data-testid="rule">
          {target.rule === 'nearestPrice' ? <T k="cmp.rule.nearestPrice" p={{ rival: target.model.name }} /> : <T k="cmp.rule.sameType" />}
        </p>
        <HonestRead rows={rows} ours={pick.model.name} theirs={target.model.name} />
      </div>
      <div className="reach">
        <div className="seg" role="tablist">
          {groups.map((g) => <button key={g} type="button" role="tab" aria-selected={s.group === g} className={`segbtn${s.group === g ? ' is-on' : ''}`} onClick={() => send({ type: 'SET_GROUP', group: g })} data-testid={`group-${g}`}><T k={`cmp.group.${g}`} /></button>)}
        </div>
        <table className="cmp">
          <thead><tr><td /><th scope="col">{pick.model.name}</th><th scope="col">{target.model.name}</th></tr></thead>
          <tbody>{shown.map((r) => <RowView key={r.key} r={r} />)}</tbody>
        </table>
        {s.group === 'ownership' && twin && <TwinPanel />}
        <p className="fine"><T k="cmp.legend" /></p>
        <div className="cta-row cta-3">
          <button type="button" className="btn" onClick={() => choose(copyOf(lang, 'cmp.switch'), pick.model, pick.variant.id, (id) => send({ type: 'SET_PICK', variantId: id }))} data-testid="switch-ours"><T k="cmp.switch" />: {pick.model.name}</button>
          <button type="button" className="btn" onClick={() => choose(copyOf(lang, 'cmp.switch'), target.model, target.variant.id, (id) => send({ type: 'SET_RIVAL_VARIANT', variantId: id }))} data-testid="switch-theirs"><T k="cmp.switch" />: {target.model.name}</button>
          {(options.length > 1 || (options.length === 1 && hasSibling)) && (
            <button type="button" className="btn" data-testid="switch-rival" onClick={() => pop.open({ title: copyOf(lang, 'cmp.against'), body: (
              <div className="opts">
                {options.map((id) => { const m = RIVALS.find((r) => r.id === id)!; return <Opt key={id} on={!target.sibling && target.model.id === id} onClick={() => { send({ type: 'SET_RIVAL', rivalId: id }); pop.close(); }} title={`${m.brand} ${m.name}`} testid={`against-${id}`} />; })}
                {hasSibling && <Opt on={target.sibling} onClick={() => { send({ type: 'SET_RIVAL', rivalId: SIBLING, sibling: true }); pop.close(); }} title={<T k="sl.sibling" />} testid="against-sibling" />}
              </div>
            ) })}><T k="cmp.against" /></button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Ask ----------
/** Values an answer template can draw from the current session. */
export function answerContext(k: Pick<Kiosk, 'pick' | 'target' | 'prices'>, km: number, years: number): { ctx: (name: string) => SlotValue; facts: (names: string[]) => string[] } {
  const { pick, target, prices } = k;
  const cost = pick ? carCost(pick.model, pick.variant, prices, km, years, 'claimed') : null;
  const factFor = (name: string): string | null => {
    if (!pick) return null;
    const v = pick.variant.facts;
    const m = pick.model.facts;
    const map: Record<string, string | null> = {
      pickPrice: v.price, pickEff: v.efficiency ?? v.range, pickCrash: m.crash, pickAirbags: m.airbags, pickAdas: v.adas,
      pickBoot: v.boot ?? m.boot, pickGc: m.groundClearance, pickWarranty: m.warranty, pickPowertrain: v.powertrain,
    };
    return map[name] ?? null;
  };
  const ctx = (name: string): SlotValue => {
    if (name === 'pickName') return pick ? `${pick.model.name} ${pick.variant.name}` : null;
    if (name === 'rivalName') return target ? target.model.name : null;
    if (name === 'km') return { ui: km };
    if (name === 'monthly') return cost ? { calc: cost.monthly } : <Verify what="claimed efficiency for this variant" />;
    if (name === 'per1000') return cost ? { calc: cost.per1000 } : <Verify what="claimed efficiency for this variant" />;
    const id = factFor(name);
    return id ? { fact: id } : <Verify what={name} />;
  };
  return { ctx, facts: (names) => names.map(factFor).filter((x): x is string => Boolean(x)) };
}
export function Answer({ q, k, km, years, plain }: { q: AskedQuestion; k: Pick<Kiosk, 'pick' | 'target' | 'prices'>; km: number; years: number; plain?: boolean }) {
  const lang = useLang();
  const intent = q.intent ? intentById(q.intent) : null;
  const { ctx, facts } = answerContext(k, km, years);
  if (!intent) return <p className="answer answer-none" data-testid="answer-none"><T k="ask.unanswered" /></p>;
  const tpl = intent.a[lang];
  const ctxNames = [...tpl.matchAll(/\{c:([^}]+)\}/g)].map((m) => m[1]!);
  const ids = [...new Set([...factIdsIn(tpl), ...facts(ctxNames)])];
  return (
    <div className="answer" data-testid="answer" data-intent={intent.id}>
      <p><Tpl tpl={tpl} ctx={ctx} plain={plain} /></p>
      {intent.route === 'expert' && <p className="routed" data-testid="routed"><T k="ask.routed" /></p>}
      <p className="fine">
        <T k="ask.facts" />: {ids.length === 0 ? <T k="ask.nofacts" /> : ids.map((id, i) => <span key={id}>{i > 0 && ' · '}<Fact id={id} plain={plain} /></span>)}
        {' · '}<T k="ask.checked" /> <span data-ui>{intent.checked}</span>
      </p>
    </div>
  );
}

const KEYS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
export function Ask() {
  const k = useKiosk();
  const { s, send, pick, target } = k;
  const t = useText();
  const [text, setText] = useState('');
  const [kb, setKb] = useState(false);
  const ctx = { modelId: pick?.model.id ?? null, rivalId: target && !target.sibling ? target.model.id : null };
  const chips = suggestions(ctx, s.lang, 6);
  const submit = (q: string) => {
    const clean = q.trim();
    if (clean.length < 3) return;
    const r = ask(clean, ctx);
    send({ type: 'ASK', question: { q: clean.slice(0, 140), intent: r.intent?.id ?? null, route: r.route, lang: s.lang, at: Date.now() } });
    setText('');
    setKb(false);
  };
  const last = s.questions.slice(-1)[0];
  return (
    <div className="screen screen-ask">
      <div className="display">
        <h1><T k="ask.title" /></h1>
        <p className="lede"><T k="ask.sub" /></p>
        <div className="thread" aria-live="polite">
          {!last && <p className="note"><T k="ask.empty" /></p>}
          {last && (<><p className="asked"><span className="eyebrow"><T k="ask.you" /></span><span data-ui>{last.q}</span></p><Answer q={last} k={k} km={s.calc.km} years={s.calc.years} /></>)}
        </div>
      </div>
      <div className="reach">
        {!kb && (<>
          <h2><T k="ask.suggested" /></h2>
          <div className="chips">{chips.map((c) => <button key={c.id} type="button" className="chipbtn" onClick={() => submit(c.q)} data-testid={`chip-${c.id}`}>{c.q}</button>)}</div>
        </>)}
        <div className="askbar">
          <input className="askinput" value={text} onChange={(e) => setText(e.target.value)} onFocus={() => setKb(true)} onKeyDown={(e) => { if (e.key === 'Enter') submit(text); }} placeholder={t('ask.placeholder')} aria-label={t('ask.type')} inputMode="none" data-testid="ask-input" />
          <button type="button" className="btn btn-primary" onClick={() => submit(text)} disabled={text.trim().length < 3} data-testid="ask-send"><T k="ask.send" /></button>
        </div>
        {kb && (
          <div className="kb" data-testid="keyboard">
            {s.lang === 'hi' && <p className="fine"><T k="ask.kb.note" /></p>}
            {KEYS.map((row) => <div key={row} className="kbrow">{row.split('').map((ch) => <button key={ch} type="button" className="key" onClick={() => setText((x) => (x + ch).slice(0, 140))}>{ch}</button>)}</div>)}
            <div className="kbrow">
              <button type="button" className="key key-wide" onClick={() => setKb(false)}><T k="ask.kb.done" /></button>
              <button type="button" className="key key-space" onClick={() => setText((x) => (x + ' ').slice(0, 140))}><T k="ask.kb.space" /></button>
              <button type="button" className="key key-wide" onClick={() => setText((x) => x.slice(0, -1))} aria-label={t('ask.kb.delete')}><Delete aria-hidden /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Costs ----------
export function Stepper({ label, value, onDec, onInc, children }: { label: ReactNode; value: ReactNode; onDec: () => void; onInc: () => void; children?: ReactNode }) {
  const t = useText();
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-row">
        <button type="button" className="btn btn-sq" onClick={onDec} aria-label={t('cost.dec')}><Minus aria-hidden /></button>
        <span className="stepper-value">{value}</span>
        <button type="button" className="btn btn-sq" onClick={onInc} aria-label={t('cost.inc')}><Plus aria-hidden /></button>
      </div>
      {children}
    </div>
  );
}

export function CostChart({ cars, names, years, cross }: { cars: CarCost[]; names: Record<string, string>; years: number; cross: number | null }) {
  const lang = useLang();
  const t = useText();
  const W = 960, H = 400, L = 20, R = 250, T0 = 30, B = 60;
  const series = costSeries(cars, years);
  const months = years * 12;
  const all = Object.values(series).flat().map((p) => p.cost);
  const lo = Math.min(...all), hi = Math.max(...all);
  const x = (m: number) => L + (m / months) * (W - L - R);
  const y = (c: number) => T0 + (1 - (c - lo) / (hi - lo || 1)) * (H - T0 - B);
  const ends = cars.map((c) => ({ c, ey: y(series[c.id]![months]!.cost) }));
  if (ends.length === 2 && Math.abs(ends[0]!.ey - ends[1]!.ey) < 64) {
    const up = ends[0]!.ey < ends[1]!.ey ? 0 : 1;
    const mid = (ends[0]!.ey + ends[1]!.ey) / 2;
    ends[up]!.ey = mid - 34; ends[1 - up]!.ey = mid + 34;
  }
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('cost.chart.alt')}>
      {Array.from({ length: years + 1 }, (_, i) => i * 12).map((m) => (
        <g key={m}><line x1={x(m)} x2={x(m)} y1={T0} y2={H - B} className="grid" /><text x={x(m)} y={H - B + 34} textAnchor="middle" className="tick" data-ui>{m}</text></g>
      ))}
      <text x={L} y={H - 2} className="tick"><T k="cost.chart.months" /></text>
      {cars.map((c, i) => (
        <g key={c.id}>
          <polyline points={series[c.id]!.map((p) => `${x(p.month)},${y(p.cost)}`).join(' ')} className={`line line-${i}`} />
          <circle cx={x(months)} cy={y(series[c.id]![months]!.cost)} r="7" className={`dot dot-${i}`} />
          <text x={W - R + 18} y={ends[i]!.ey - 4} className="endlabel">{names[c.id]}</text>
          <text x={W - R + 18} y={ends[i]!.ey + 28} className="endvalue" data-calc={c.total.id}>{calcText(c.total, lang)}</text>
        </g>
      ))}
      {cross !== null && cross > 0 && cross <= months && (
        <g><line x1={x(cross)} x2={x(cross)} y1={T0} y2={H - B} className="crossline" /><text x={x(cross) + 10} y={T0 + 22} className="crosslabel"><T k="cost.chart.cross" /></text></g>
      )}
    </svg>
  );
}

export function costModel(pick: { model: Model; variant: Variant }, target: { model: Model; variant: Variant } | null, prices: FuelPrices, km: number, years: number, basis: 'claimed' | 'owner') {
  const a = carCost(pick.model, pick.variant, prices, km, years, basis);
  const b = target ? carCost(target.model, target.variant, prices, km, years, basis) : null;
  const pb = a && b ? payBack(a, b, km, years) : null;
  const names: Record<string, string> = { [pick.variant.id]: pick.model.name };
  if (target) names[target.variant.id] = target.model.name;
  return { a, b, pb, names, cars: [a, b].filter((c): c is CarCost => c !== null) };
}

export function PayBackLine({ pb, names }: { pb: NonNullable<ReturnType<typeof costModel>['pb']>; names: Record<string, string> }) {
  if (pb.kind === 'samePrice') return <p><T k="cost.breakeven.same" /></p>;
  if (pb.kind === 'cheaperBoth') return <p><T k="cost.breakeven.both" p={{ cheap: names[pb.cheap] }} /></p>;
  if (pb.kind === 'never') return <p><T k="cost.breakeven.never" p={{ dear: names[pb.dear], gap: { calc: pb.gap } }} /></p>;
  return (
    <p data-testid="payback">
      <T k="cost.breakeven.yes" p={{ dear: names[pb.dear], gap: { calc: pb.gap }, saving: { calc: pb.saving }, km: { calc: pb.km }, month: { calc: pb.months } }} />
      {pb.beyond && <> <T k="cost.breakeven.beyond" /></>}
    </p>
  );
}

export function Costs() {
  const { s, send, pick, target, prices } = useKiosk();
  if (!pick) return null;
  const { a, b, pb, names, cars } = costModel(pick, target, prices, s.calc.km, s.calc.years, s.calc.basis);
  const fuels = new Set([pick.variant.fuel, target?.variant.fuel].filter(Boolean));
  const set = (patch: Partial<typeof s.calc>) => send({ type: 'SET_CALC', patch });
  const ownerAvailable = Boolean(ownerEfficiency(pick.model, pick.variant) || (target && ownerEfficiency(target.model, target.variant)));
  const fuelRow = (key: 'petrol' | 'cng' | 'diesel', step: number) => (
    <Stepper key={key} label={<T k={`cost.${key}`} />} value={<UiMoney value={prices[key]} />} onDec={() => set({ [key]: Math.max(Math.round((prices[key] - step) * 100) / 100, 1) })} onInc={() => set({ [key]: Math.round((prices[key] + step) * 100) / 100 })} />
  );
  return (
    <div className="screen screen-costs">
      <div className="display">
        <h1><T k="cost.title" /></h1>
        <table className="cmp cmp-cost">
          <thead><tr><td /><th scope="col">{pick.model.name}</th>{target && <th scope="col">{target.model.name}</th>}</tr></thead>
          <tbody>
            <tr><th scope="row"><T k="cost.monthly" /></th><td data-testid="monthly-a">{a ? <Calc v={a.monthly} /> : <Verify what={`${pick.model.name}: efficiency or consumption`} />}</td>{target && <td>{b ? <Calc v={b.monthly} /> : <Verify what={`${target.model.name}: efficiency`} />}</td>}</tr>
            <tr><th scope="row"><T k="cost.total" /></th><td>{a ? <Calc v={a.total} /> : <Verify what="total" />}</td>{target && <td>{b ? <Calc v={b.total} /> : <Verify what="total" />}</td>}</tr>
          </tbody>
        </table>
        {cars.length > 0 && <CostChart cars={cars} names={names} years={s.calc.years} cross={pb?.kind === 'catchesUp' ? pb.months.value : null} />}
        {!a && pick.variant.fuel === 'ev' && <p className="notice"><T k="cost.ev" /> <Fact id="ev.consumption" /></p>}
        {!a && pick.variant.fuel !== 'ev' && <p className="notice"><T k="cost.nodata" p={{ name: pick.model.name }} /></p>}
        {target && !b && <p className="notice"><T k="cost.nodata" p={{ name: target.model.name }} /></p>}
      </div>
      <div className="reach">
        <div className="payback">
          <h2><T k="cost.breakeven.title" /></h2>
          {pb ? <PayBackLine pb={pb} names={names} /> : <p className="note"><T k="cost.single" /></p>}
        </div>
        <div className="steppers">
          <Stepper label={<T k="cost.km" />} value={<><Ui>{s.calc.km}</Ui> <T k="cost.km.unit" /></>} onDec={() => set({ km: s.calc.km - 100 })} onInc={() => set({ km: s.calc.km + 100 })}>
            <input type="range" className="slider" min={100} max={6000} step={50} value={s.calc.km} onChange={(e) => set({ km: Number(e.target.value) })} aria-label={copyOf(s.lang, 'cost.km')} data-testid="km-slider" />
          </Stepper>
          <Stepper label={<T k="cost.years" />} value={<Ui>{s.calc.years}</Ui>} onDec={() => set({ years: s.calc.years - 1 })} onInc={() => set({ years: s.calc.years + 1 })} />
          {(fuels.has('petrol') || fuels.has('hybrid')) && fuelRow('petrol', 0.5)}
          {fuels.has('cng') && fuelRow('cng', 0.5)}
          {fuels.has('diesel') && fuelRow('diesel', 0.5)}
        </div>
        <div className="seg" role="group" aria-label={copyOf(s.lang, 'cost.basis')}>
          <button type="button" className={`segbtn${s.calc.basis === 'claimed' ? ' is-on' : ''}`} aria-pressed={s.calc.basis === 'claimed'} onClick={() => set({ basis: 'claimed' })}><T k="cost.basis.claimed" /></button>
          <button type="button" className={`segbtn${s.calc.basis === 'owner' ? ' is-on' : ''}`} aria-pressed={s.calc.basis === 'owner'} onClick={() => set({ basis: 'owner' })} data-testid="basis-owner"><T k="cost.basis.owner" /></button>
          <button type="button" className="segbtn" onClick={() => set({ petrol: null, cng: null, diesel: null })}><T k="cost.reset" /></button>
        </div>
        {s.calc.basis === 'owner' && <p className="fine"><T k={ownerAvailable ? 'cost.basis.owner.note' : 'cost.basis.owner.none'} /></p>}
        <p className="fine"><T k="cost.excluded" /> <T k="cost.floor" /> <Proposed /></p>
      </div>
    </div>
  );
}

// ---------- Promises ----------
const TABS: PromiseTab[] = ['promise', 'pledge', 'weekend'];
export function PromiseBody({ tab, plain }: { tab: PromiseTab; plain?: boolean }) {
  return (
    <div className="promise" data-testid={`promise-${tab}`}>
      <p className="terms"><T k={`prom.${tab}.terms`} plain={plain} /> <Proposed plain={plain} /></p>
      <h2><T k="prom.evidence" /></h2>
      <ul>{['e1', 'e2', 'e3'].map((e) => <li key={e}><T k={`prom.${tab}.${e}`} plain={plain} /></li>)}</ul>
    </div>
  );
}
export function Promises() {
  const { s, send } = useKiosk();
  return (
    <div className="screen screen-promises">
      <div className="display"><h1><T k="prom.title" /></h1><PromiseBody tab={s.promiseTab} /></div>
      <div className="reach">
        <div className="opts">
          {TABS.map((tab) => <Opt key={tab} on={s.promiseTab === tab} onClick={() => send({ type: 'SET_PROMISE_TAB', tab })} title={<T k={`prom.tab.${tab}`} />} testid={`tab-${tab}`} />)}
        </div>
        <button type="button" className="btn btn-primary btn-xl" onClick={() => send({ type: 'HANDOFF_MODE', mode: 'book' })} data-testid="promise-book"><T k="prom.cta" /><ArrowRight aria-hidden /></button>
      </div>
    </div>
  );
}

// ---------- Hand-off ----------
function QrPanel() {
  const { send, payload } = useKiosk();
  const t = useText();
  const [src, setSrc] = useState<string | null>(null);
  const url = `${window.location.origin}/m#${payload}`;
  useEffect(() => { QRCode.toDataURL(url, { margin: 1, width: 560, errorCorrectionLevel: 'M' }).then(setSrc).catch(() => setSrc(null)); }, [url]);
  return (
    <div className="panel panel-qr">
      <h2><T k="ho.qr.title" /></h2>
      <p><T k="ho.qr.body" /></p>
      {src && <img className="qr" src={src} alt={t('ho.qr.alt')} data-testid="qr" data-url={url} />}
      <p className="fine"><T k="ho.qr.hint" /></p>
      <button type="button" className="btn btn-primary btn-xl" onClick={() => { send({ type: 'SCANNED' }); send({ type: 'COMPLETE' }); }} data-testid="qr-done"><T k="ho.qr.done" /></button>
    </div>
  );
}
function PhonePanel() {
  const { s, send } = useKiosk();
  const t = useText();
  const h = s.handoff;
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  if (h.sent) {
    return (
      <div className="panel">
        <h2 data-testid="sent"><T k="ho.sent" p={{ last: { ui: h.phone.slice(-2) } }} /></h2>
        <p className="notice"><T k="ho.demo" /></p>
        <button type="button" className="btn btn-primary btn-xl" onClick={() => send({ type: 'COMPLETE' })} data-testid="finish"><T k="ho.finish" /></button>
      </div>
    );
  }
  return (
    <div className="panel panel-phone">
      <div className="consent" data-testid="consent">
        <h2><T k="consent.title" /></h2>
        <ul>{['what', 'why', 'who', 'long', 'withdraw', 'law'].map((k) => <li key={k}><T k={`consent.${k}`} /></li>)}</ul>
      </div>
      <div className="phone-entry">
        <div className="phone-display" aria-label={t('ho.phone.label')} data-testid="phone-display"><Ui>{h.phone || '··········'}</Ui></div>
        {h.phone.length > 0 && !isValidPhone(h.phone) && <p className="fine"><T k="ho.phone.invalid" /></p>}
        <div className="keypad">
          {digits.map((d) => <button key={d} type="button" className="key key-num" onClick={() => send({ type: 'KEY_DIGIT', digit: d })} data-testid={`digit-${d}`}><Ui>{d}</Ui></button>)}
          <span />
          <button type="button" className="key key-num" onClick={() => send({ type: 'KEY_DIGIT', digit: '0' })} data-testid="digit-0"><Ui>{'0'}</Ui></button>
          <button type="button" className="key key-num" onClick={() => send({ type: 'KEY_DEL' })} aria-label={t('ho.phone.del')}><Delete aria-hidden /></button>
        </div>
        <label className="tick">
          <input type="checkbox" checked={h.consent} onChange={() => send({ type: 'TOGGLE_CONSENT' })} data-testid="consent-tick" />
          <span><T k="consent.tick" /></span>
        </label>
        <button type="button" className="btn btn-primary btn-xl" disabled={!canSend(h.phone, h.consent)} onClick={() => send({ type: 'SEND' })} data-testid="send"><T k="ho.send" /></button>
        <p className="fine"><T k="ho.demo" /></p>
      </div>
    </div>
  );
}
function BookPanel() {
  const { s, send, pick, crossChannel } = useKiosk();
  const lang = useLang();
  const h = s.handoff;
  const outlet = crossChannel && pick ? copyOf(lang, `outlet.${pick.model.channel}`) : copyOf(lang, 'outlet.here');
  return (
    <div className="panel">
      <h2><T k="ho.book.title" /> <Proposed /></h2>
      {pick && <CarHead model={pick.model} variant={pick.variant} plain />}
      <p><T k="ho.book.body" /></p>
      <div className="opts">
        {['sat1', 'sat2', 'wk'].map((slot) => <Opt key={slot} on={h.slot === slot} disabled={h.booked} onClick={() => send({ type: 'PICK_SLOT', slot })} title={<T k={`slot.${slot}`} />} testid={`slot-${slot}`} />)}
      </div>
      {!h.booked && <button type="button" className="btn btn-primary btn-xl" disabled={!h.slot} onClick={() => send({ type: 'BOOK' })} data-testid="book"><T k="ho.book.confirm" /></button>}
      {h.booked && (<>
        <p className="notice" data-testid="booked"><T k="ho.book.done" /> <T k={crossChannel ? 'ho.book.cross' : 'ho.book.here'} p={{ outlet }} />{crossChannel && <> <Proposed /></>}</p>
        <button type="button" className="btn btn-primary btn-xl" onClick={() => send({ type: 'COMPLETE' })} data-testid="finish"><T k="ho.finish" /></button>
      </>)}
    </div>
  );
}
function TalkPanel() {
  const { send } = useKiosk();
  const lang = useLang();
  return (
    <div className="panel">
      <div className="expertcard"><span className="avatar" aria-hidden><UserRound /></span><p data-testid="talked"><T k="ho.talk.done" p={{ name: copyOf(lang, 'expert.name') }} /></p></div>
      <button type="button" className="btn btn-primary btn-xl" onClick={() => send({ type: 'COMPLETE' })} data-testid="finish"><T k="ho.finish" /></button>
    </div>
  );
}
export function Handoff() {
  const { s, send } = useKiosk();
  const mode = s.handoff.mode;
  const card = (m: HandoffMode, icon: ReactNode, k: string, onClick?: () => void) => (
    <button type="button" className="hocard" onClick={onClick ?? (() => send({ type: 'HANDOFF_MODE', mode: m }))} data-testid={`ho-${m}`}>
      <span className="hocard-icon" aria-hidden>{icon}</span>
      <span className="opt-text"><span className="opt-title"><T k={`ho.${k}.title`} /></span><span className="opt-desc"><T k={`ho.${k}.body`} /></span></span>
    </button>
  );
  return (
    <div className="screen screen-handoff">
      <div className="display"><h1><T k="ho.title" /></h1>{!mode && <p className="lede"><T k="ho.sub" /></p>}</div>
      <div className="reach">
        {!mode && (
          <div className="hocards">
            {card('qr', <QrCode />, 'qr')}
            {card('phone', <Smartphone />, 'phone')}
            {card('book', <CalendarCheck />, 'book')}
            {card('talk', <UserRound />, 'talk', () => { send({ type: 'HANDOFF_MODE', mode: 'talk' }); send({ type: 'TALK' }); })}
            <button type="button" className="btn" onClick={() => send({ type: 'COMPLETE' })} data-testid="finish"><T k="ho.finish" /></button>
          </div>
        )}
        {mode === 'qr' && <QrPanel />}
        {mode === 'phone' && <PhonePanel />}
        {mode === 'book' && <BookPanel />}
        {mode === 'talk' && <TalkPanel />}
      </div>
    </div>
  );
}

export function Done() {
  const { s, send } = useKiosk();
  const h = s.handoff;
  const lines = [h.scanned && 'done.qr', h.sent && 'done.phone', h.booked && 'done.book', h.talked && 'done.talk'].filter((x): x is string => Boolean(x));
  return (
    <div className="screen screen-done">
      <div className="display"><h1><T k="done.title" /></h1></div>
      <div className="reach">
        <ul className="donelist" data-testid="done">{(lines.length ? lines : ['done.none']).map((k) => <li key={k}><T k={k} /></li>)}</ul>
        <button type="button" className="btn btn-primary btn-xl" onClick={() => send({ type: 'RESET' })} data-testid="clear"><T k="done.clear" /></button>
      </div>
    </div>
  );
}
