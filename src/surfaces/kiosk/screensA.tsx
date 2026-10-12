import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { MPVS, RIVALS, SHORTLIST, lookup, modelById, type Model, type Variant } from '../../data';
import type { RowKey } from '../../domain/compare';
import type { Scored } from '../../domain/recommend';
import { BUDGETS, PRIORITIES, type AgeId, type BudgetId, type FuelPref, type KmId, type Riders } from '../../domain/types';
import { NEEDS } from '../../state/kioskMachine';
import { Fact, ImageSlot, Proposed, T, UiMoney, Verify, useLang, copyOf, type SlotValue } from '../../ui/core';
import { useKiosk } from './context';

export function Opt({ on, onClick, title, desc, badge, testid, disabled }: { on?: boolean; onClick: () => void; title: ReactNode; desc?: ReactNode; badge?: ReactNode; testid?: string; disabled?: boolean }) {
  return (
    <button type="button" className={`opt${on ? ' is-on' : ''}`} aria-pressed={Boolean(on)} onClick={onClick} data-testid={testid} disabled={disabled}>
      <span className="opt-mark" aria-hidden>{on && <Check />}</span>
      <span className="opt-text"><span className="opt-title">{title}</span>{desc && <span className="opt-desc">{desc}</span>}</span>
      {badge && <span className="opt-badge">{badge}</span>}
    </button>
  );
}

export function CarHead({ model, variant, tag, plain }: { model: Model; variant: Variant; tag?: ReactNode; plain?: boolean }) {
  return (
    <div className="carhead">
      <ImageSlot id={model.id} shape={model.silhouette} name={`${model.brand} ${model.name}`} />
      <div className="carhead-text">
        {tag && <span className="eyebrow">{tag}</span>}
        <span className="car-name">{model.name}</span>
        <span className="car-variant">{variant.name}</span>
        <span className="car-price"><Fact id={variant.facts.price} plain={plain} /></span>
      </div>
    </div>
  );
}

/** A human list: "a, b and c". */
export function RowList({ keys }: { keys: RowKey[] }) {
  const lang = useLang();
  const names = keys.map((k) => copyOf(lang, `rowname.${k}`));
  if (names.length <= 1) return <>{names[0] ?? ''}</>;
  return <>{names.slice(0, -1).join(', ')} {copyOf(lang, 'list.and')} {names[names.length - 1]}</>;
}

const PANELS = ['sit', 'reach', 'never', 'chose'] as const;
const PANEL_CAR = { sit: ['vic', 'midsize', 'Victoris'], reach: ['gv', 'midsize', 'Grand Vitara'], never: ['brz', 'compact', 'Brezza'], chose: ['frx', 'compact', 'Fronx'] } as const;
export function Attract() {
  const { s, send } = useKiosk();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % PANELS.length), 7000);
    return () => window.clearInterval(id);
  }, []);
  const p = PANELS[i]!;
  const car = PANEL_CAR[p];
  return (
    <div className="attract">
      <section className="attract-panel" key={p} aria-live="off">
        <span className="eyebrow"><T k="brand.title" /> · <T k={`channel.${s.channel}`} /></span>
        <h1><T k={`attract.${p}.title`} /></h1>
        <p className="attract-proof"><T k={`attract.${p}.proof`} /></p>
        <ImageSlot id={car[0]} shape={car[1]} name={`Maruti Suzuki ${car[2]}`} className="imgslot-hero" />
        <div className="dots" aria-hidden>{PANELS.map((x, n) => <span key={x} className={n === i ? 'is-on' : ''} />)}</div>
      </section>
      <section className="attract-cta">
        {s.wipedNote && <p className="notice" role="status" data-testid="wiped"><T k="idle.cleared" /></p>}
        <h2><T k={s.channel === 'pod' ? 'attract.pod.headline' : 'attract.headline'} /></h2>
        <p className="lede"><T k="attract.sub" /></p>
        <button type="button" className="btn btn-primary btn-xl" onClick={() => send({ type: 'START' })} data-testid="start"><T k="attract.start" /><ArrowRight aria-hidden /></button>
        <button type="button" className="btn btn-xl" onClick={() => send({ type: 'QUICK_COMPARE' })} data-testid="quick"><T k="attract.quick" /></button>
        <button type="button" className="btn btn-quiet" onClick={() => send({ type: 'SET_LANG', lang: s.lang === 'en' ? 'hi' : 'en' })} data-testid="attract-lang" lang={s.lang === 'en' ? 'hi' : 'en'}><T k={s.lang === 'en' ? 'lang.hi' : 'lang.en'} /></button>
        <p className="fine"><T k="attract.privacy" /></p>
      </section>
    </div>
  );
}

export function Language() {
  const { s, send } = useKiosk();
  const choose = (lang: 'en' | 'hi') => { send({ type: 'SET_LANG', lang }); send({ type: 'NEXT' }); };
  return (
    <div className="screen">
      <div className="display"><h1><T k="lang.title" /></h1><p className="lede"><T k="lang.sub" /></p></div>
      <div className="reach">
        <div className="opts opts-2">
          <button type="button" className={`opt opt-big${s.lang === 'en' ? ' is-on' : ''}`} onClick={() => choose('en')} lang="en" data-testid="lang-en"><span className="opt-title">English</span></button>
          <button type="button" className={`opt opt-big${s.lang === 'hi' ? ' is-on' : ''}`} onClick={() => choose('hi')} lang="hi" data-testid="lang-hi"><span className="opt-title">हिंदी</span></button>
        </div>
      </div>
    </div>
  );
}

export function Shortlist() {
  const { s, send } = useKiosk();
  const ids = SHORTLIST[s.channel];
  const full = s.answers.shortlist.length + (s.sibling ? 1 : 0) >= 2;
  return (
    <div className="screen">
      <div className="display"><h1><T k="sl.title" /></h1><p className="lede"><T k="sl.sub" /></p></div>
      <div className="reach">
        <div className="opts">
          {ids.map((id) => {
            const m = RIVALS.find((r) => r.id === id)!;
            const on = s.answers.shortlist.includes(id);
            return <Opt key={id} on={on} disabled={!on && full} onClick={() => send({ type: 'TOGGLE_RIVAL', id })} title={`${m.brand} ${m.name}`} desc={<T k={`sl.${id}.desc`} />} testid={`rival-${id}`} />;
          })}
          <Opt on={s.sibling} disabled={!s.sibling && full} onClick={() => send({ type: 'TOGGLE_SIBLING' })} title={<T k="sl.sibling" />} desc={<T k="sl.sibling.desc" />} testid="rival-sibling" />
          <Opt on={s.notSure} onClick={() => send({ type: 'NOT_SURE' })} title={<T k="sl.notsure" />} desc={<T k="sl.notsure.desc" />} testid="rival-notsure" />
        </div>
        {full && <p className="fine"><T k="sl.max" /></p>}
      </div>
    </div>
  );
}

const BUDGET_IDS: BudgetId[] = ['u10', 'b10_14', 'b14_18', 'b18_22', 'o22', 'all'];
const KM_OPTS: Array<{ id: KmId; k: string; p: Record<string, SlotValue> }> = [
  { id: 'k800', k: 'opt.km.under', p: { a: { ui: 800 } } },
  { id: 'k1500', k: 'opt.km.band', p: { a: { ui: 800 }, b: { ui: 1500 } } },
  { id: 'k2500', k: 'opt.km.band', p: { a: { ui: 1500 }, b: { ui: 2500 } } },
  { id: 'k3000', k: 'opt.km.over', p: { a: { ui: 2500 } } },
];
const AGE_OPTS: Array<{ id: AgeId; k: string; p: Record<string, SlotValue> }> = [
  { id: 'u25', k: 'opt.age.under', p: { a: { ui: 25 } } },
  { id: 'a25_34', k: 'opt.age.band', p: { a: { ui: 25 }, b: { ui: 34 } } },
  { id: 'a35_44', k: 'opt.age.band', p: { a: { ui: 35 }, b: { ui: 44 } } },
  { id: 'o45', k: 'opt.age.over', p: { a: { ui: 45 } } },
];

export function Needs() {
  const { s, send } = useKiosk();
  const key = NEEDS[s.needsIndex]!;
  const a = s.answers;
  const then = (e: Parameters<typeof send>[0]) => { send(e); send({ type: 'NEXT' }); };
  const titleKey = { budget: 'q.budget', km: 'q.km', priorities: 'q.pri', riders: 'q.riders', fuel: 'q.fuel', age: 'q.age' }[key];
  let body: ReactNode = null;
  if (key === 'budget') {
    body = BUDGET_IDS.map((id) => {
      const b = BUDGETS[id];
      const title = id === 'all' ? <T k="opt.budget.all" />
        : id === 'u10' ? <T k="opt.budget.u10" p={{ hi: <UiMoney value={b.max} /> }} />
        : id === 'o22' ? <T k="opt.budget.o22" p={{ lo: <UiMoney value={b.min} /> }} />
        : <T k="opt.budget.band" p={{ lo: <UiMoney value={b.min} />, hi: <UiMoney value={b.max} /> }} />;
      return <Opt key={id} on={a.budget === id} onClick={() => then({ type: 'ANSWER_BUDGET', value: id })} title={title} testid={`budget-${id}`} />;
    });
  } else if (key === 'km') {
    body = KM_OPTS.map((o) => <Opt key={o.id} on={a.km === o.id} onClick={() => then({ type: 'ANSWER_KM', value: o.id })} title={<T k={o.k} p={o.p} />} testid={`km-${o.id}`} />);
  } else if (key === 'priorities') {
    body = PRIORITIES.map((p) => {
      const idx = a.priorities.indexOf(p);
      return <Opt key={p} on={idx >= 0} disabled={idx < 0 && a.priorities.length >= 2} onClick={() => send({ type: 'TOGGLE_PRIORITY', value: p })} title={<T k={`pri.${p}`} />} badge={idx >= 0 ? <T k={idx === 0 ? 'pri.first' : 'pri.second'} /> : undefined} testid={`pri-${p}`} />;
    });
  } else if (key === 'riders') {
    body = (['few', 'family', 'many'] as Riders[]).map((r) => <Opt key={r} on={a.riders === r} onClick={() => then({ type: 'ANSWER_RIDERS', value: r })} title={<T k={`opt.riders.${r}`} />} testid={`riders-${r}`} />);
  } else if (key === 'fuel') {
    body = (['petrol', 'cng', 'hybrid', 'ev', 'any'] as FuelPref[]).map((f) => <Opt key={f} on={a.fuel === f} onClick={() => then({ type: 'ANSWER_FUEL', value: f })} title={<T k={`opt.fuel.${f}`} />} testid={`fuel-${f}`} />);
  } else {
    body = (
      <>
        {AGE_OPTS.map((o) => <Opt key={o.id} on={a.age === o.id} onClick={() => send({ type: 'ANSWER_AGE', value: o.id })} title={<T k={o.k} p={o.p} />} testid={`age-${o.id}`} />)}
        <Opt onClick={() => send({ type: 'ANSWER_AGE', value: null })} title={<T k="q.age.skip" />} testid="age-skip" />
      </>
    );
  }
  return (
    <div className="screen">
      <div className="display">
        {key !== 'age' && <span className="eyebrow"><T k="needs.count" p={{ i: { ui: s.needsIndex + 1 }, n: { ui: 5 } }} /></span>}
        <h1><T k={`${titleKey}.title`} /></h1>
        <p className="lede"><T k={`${titleKey}.sub`} /></p>
      </div>
      <div className="reach"><div className={`opts${key === 'priorities' || key === 'budget' ? ' opts-2' : ''}`}>{body}</div></div>
    </div>
  );
}

function Reasons({ scored }: { scored: Scored }) {
  return (
    <ul className="reasons">
      {scored.reasons.map((r) => {
        const p: Record<string, SlotValue> = {};
        r.facts.forEach((id, i) => { p[`f${i}`] = { fact: id }; });
        if (r.calc) p.calc = { calc: r.calc };
        return (
          <li key={r.key}>
            <T k={r.key} p={p} />
            {r.key === 'reason.design' && <span className="note"> <T k="match.design.note" /> <Verify what="feature lists per variant" /></span>}
            {r.key === 'reason.running.unscored' && <> <Fact id="ev.consumption" /></>}
            {r.key === 'reason.promise' && <> <Proposed /></>}
          </li>
        );
      })}
    </ul>
  );
}

function AltCard({ scored, label }: { scored: Scored; label?: ReactNode }) {
  const { s, send, pick } = useKiosk();
  const v = lookup(scored.variantId)!;
  const home = s.channel === 'pod' ? null : s.channel;
  const cross = home !== null && v.model.channel !== home;
  return (
    <button type="button" className="altcard" onClick={() => send({ type: 'SET_PICK', variantId: scored.variantId })} data-testid={`alt-${v.model.id}`}>
      <CarHead model={v.model} variant={v.variant} tag={label} plain />
      <span className="altcard-note">
        <T k={cross ? 'match.also.cross' : pick && pick.model.channel === v.model.channel ? 'match.also.same' : 'match.also.plain'} p={{ channel: copyOf(s.lang, `ch.${v.model.channel}`) }} />
        {cross && <> <Proposed plain /></>}
      </span>
      <span className="altcard-go"><T k="match.choose" /><ArrowRight aria-hidden /></span>
    </button>
  );
}

export function Match() {
  const { s, send, rec, pick, crossChannel } = useKiosk();
  const lang = useLang();
  if (rec.noFit?.kind === 'seats') {
    return (
      <div className="screen">
        <div className="display"><h1><T k="match.nofit.seats.title" /></h1><p className="lede"><T k="match.nofit.seats.body" /></p></div>
        <div className="reach">
          <ul className="mpvs">
            {MPVS.map((m) => (
              <li key={m.id}>
                <strong><T k="match.mpv" p={{ name: m.name, channel: copyOf(lang, `ch.${m.channel}`) }} /></strong>
                <span><T k="match.mpv.seats" p={{ seats: { fact: m.seats } }} /></span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-xl" onClick={() => send({ type: 'BACK' })}><T k="match.change" /></button>
        </div>
      </div>
    );
  }
  if (!pick) return null;
  const budgetMiss = rec.noFit?.kind === 'budget' ? rec.noFit : null;
  const primary = rec.primary && rec.primary.variantId === pick.variant.id ? rec.primary : null;
  const scored = primary ?? (rec.alternative && rec.alternative.variantId === pick.variant.id ? rec.alternative : null);
  const alt = budgetMiss ? budgetMiss.nearest.find((n) => n.variantId !== pick.variant.id) : rec.alternative && rec.alternative.modelId !== pick.model.id ? rec.alternative : rec.primary && rec.primary.modelId !== pick.model.id ? rec.primary : null;
  const top = s.answers.priorities[0];
  return (
    <div className="screen screen-match">
      <div className="display">
        <span className="eyebrow"><T k="match.title" /></span>
        {budgetMiss && <p className="notice"><strong><T k="match.nofit.budget.title" /></strong> <T k="match.nofit.budget.body" p={{ gap: { calc: budgetMiss.gap } }} /></p>}
        {rec.noFit?.kind === 'aboveRange' && <p className="notice"><T k="match.above" /></p>}
        <CarHead model={pick.model} variant={pick.variant} tag={<T k="match.at" p={{ channel: copyOf(lang, `ch.${pick.model.channel}`) }} />} />
        {scored && (<><h2><T k="match.why" /></h2><Reasons scored={scored} /></>)}
        {crossChannel && <p className="cross" data-testid="cross"><T k="match.cross" p={{ channel: copyOf(lang, `ch.${pick.model.channel}`) }} /> <Proposed /></p>}
      </div>
      <div className="reach">
        {primary && <h2><T k="match.rival.title" /></h2>}
        {primary && s.answers.shortlist.length === 0 && <p className="note"><T k="match.rival.none" /></p>}
        <ul className="rivalnotes">
          {(primary ? rec.rivalNotes : []).map((n) => {
            const name = modelById(n.rivalId)!.name;
            return (
              <li key={n.rivalId} data-testid={`rivalnote-${n.rivalId}`}>
                {n.rivalWinsTop && top && <p className="wins" data-testid="rival-wins"><T k="match.rival.wins" p={{ priority: copyOf(lang, `pri.${top}`), rival: name }} /></p>}
                {n.rows.length > 0 ? <p><T k="match.rival.line" p={{ rival: name, rows: <RowList keys={n.rows} /> }} /></p> : <p><T k="match.rival.noedge" p={{ rival: name }} /></p>}
              </li>
            );
          })}
        </ul>
        {alt && <AltCard scored={alt} label={<T k="match.also" />} />}
        <div className="cta-row">
          <button type="button" className="btn btn-primary btn-xl" onClick={() => send({ type: 'NEXT' })} data-testid="see-compare"><T k="match.cta.compare" /><ArrowRight aria-hidden /></button>
          <button type="button" className="btn btn-xl" onClick={() => send({ type: 'HANDOFF_MODE', mode: 'book' })} data-testid="book-from-match"><T k="match.cta.drive" /></button>
        </div>
      </div>
    </div>
  );
}
