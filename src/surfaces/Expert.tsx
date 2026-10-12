import { useEffect, useMemo, useState } from 'react';
import { AlarmClock, CircleCheck, TriangleAlert } from 'lucide-react';
import { RIVALS, lookup, modelById, num } from '../data';
import { maskPhone } from '../domain/payload';
import { guessProfile, suggestConversation } from '../domain/profile';
import { intentById } from '../domain/qa';
import { rivalNote } from '../domain/recommend';
import { BUDGETS, EMPTY_ANSWERS, KM_MID, type LeadStatus, type SessionRecord } from '../domain/types';
import { patchSession, useSessions } from '../state/bus';
import { Fact, FixedStage, Footer, LangProvider, Sim, Surface, T, Ui, UiMoney, copyOf } from '../ui/core';
import '../ui/rest.css';

const HOUR = 3600000;
const SAMPLE_SEED = 7;
function samples(now: number): SessionRecord[] {
  const base = (id: string, over: Partial<SessionRecord>): SessionRecord => ({
    id, sample: true, channel: 'nexa', lang: 'en', startedAt: now - 2 * HOUR, updatedAt: now - HOUR, furthest: 'handoff', quick: false,
    answers: { ...EMPTY_ANSWERS }, pickVariantId: null, rivalId: null, questions: [],
    handoff: { mode: 'talk', at: now - HOUR, consent: false, phone: null, slot: null, crossChannel: false },
    lead: { status: 'new', contactedAt: null, pledgeExplained: false, referred: false, lostReason: null }, ...over,
  });
  return [
    base('sample-a', {
      answers: { ...EMPTY_ANSWERS, budget: 'b18_22', km: 'k2500', priorities: ['resale', 'design'], riders: 'few', fuel: 'hybrid', shortlist: ['hy', 'cr'] },
      pickVariantId: 'gv.alphaplus-sh', rivalId: 'hy',
      questions: [{ q: 'Is the Toyota warranty longer?', intent: 'warranty.toyota', route: 'answer', lang: 'en', at: 0 }, { q: 'What does a hybrid battery cost to replace?', intent: null, route: 'unanswered', lang: 'en', at: 0 }],
      handoff: { mode: 'book', at: now - 0.6 * HOUR, consent: true, phone: '0000000000', slot: 'sat1', crossChannel: false },
    }),
    base('sample-b', {
      channel: 'nexa', lang: 'hi',
      answers: { ...EMPTY_ANSWERS, budget: 'b14_18', km: 'k1500', priorities: ['safety', 'running'], riders: 'family', fuel: 'hybrid', shortlist: ['cr'] },
      pickVariantId: 'vic.vxi-sh', rivalId: 'cr',
      questions: [{ q: 'on road price kitna hai', intent: 'price.offers', route: 'expert', lang: 'hi', at: 0 }],
      handoff: { mode: 'talk', at: now - 14 * HOUR, consent: false, phone: null, slot: null, crossChannel: true },
    }),
    base('sample-c', {
      answers: { ...EMPTY_ANSWERS, budget: 'u10', km: 'k1500', priorities: ['design', 'running'], riders: 'few', fuel: 'cng', shortlist: [] },
      pickVariantId: 'frx.delta-cng', rivalId: null,
      handoff: { mode: 'phone', at: now - 26 * HOUR, consent: true, phone: '0000000000', slot: null, crossChannel: false },
    }),
  ];
}

function Clock({ r, now, plain }: { r: SessionRecord; now: number; plain?: boolean }) {
  if (r.lead.contactedAt) return <span className="clock clock-ok"><CircleCheck aria-hidden /><T k="x.ex.clock.stopped" /></span>;
  if (!r.handoff.at) return <span className="clock"><T k="x.ex.clock.none" /></span>;
  const hours = (now - r.handoff.at) / HOUR;
  const t = hours < 1 ? <T k="x.ex.ago.m" p={{ n: { ui: Math.max(Math.round(hours * 60), 0) } }} /> : <T k="x.ex.ago.h" p={{ n: { ui: Math.round(hours * 10) / 10 } }} />;
  const state = hours >= 24 ? 'late' : hours >= 12 ? 'warn' : 'ok';
  const Icon = state === 'ok' ? AlarmClock : TriangleAlert;
  return <span className={`clock clock-${state}`} data-testid="clock" data-state={state}><Icon aria-hidden /><T k={`x.ex.clock.${state}`} p={{ t }} plain={plain} /></span>;
}

export default function Expert() {
  const live = useSessions().filter((r) => r.handoff.at !== null);
  const [now, setNow] = useState(Date.now());
  const [sampleState, setSampleState] = useState<Record<string, SessionRecord['lead']>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [lostOpen, setLostOpen] = useState(false);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 5000); return () => window.clearInterval(id); }, []);
  const base = useMemo(() => samples(Date.now()), []);
  const all = [...live, ...base.map((s) => ({ ...s, lead: sampleState[s.id] ?? s.lead }))];
  const cur = all.find((r) => r.id === selected) ?? all[0] ?? null;
  const lang = 'en' as const;
  const prices = { petrol: num('fuel.petrol.delhi')!, cng: num('fuel.cng.delhi')!, diesel: num('fuel.diesel.delhi')! };

  const update = (r: SessionRecord, fn: (l: SessionRecord['lead']) => SessionRecord['lead']) => {
    if (r.sample) setSampleState((s) => ({ ...s, [r.id]: fn(s[r.id] ?? r.lead) }));
    else patchSession(r.id, (x) => ({ ...x, lead: fn(x.lead) }));
  };
  const setStatus = (r: SessionRecord, status: LeadStatus, extra: Partial<SessionRecord['lead']> = {}) => update(r, (l) => ({ ...l, status, contactedAt: l.contactedAt ?? Date.now(), ...extra }));

  let detail: React.ReactNode = <p className="note"><T k="x.ex.empty" /></p>;
  if (cur) {
    const pick = cur.pickVariantId ? lookup(cur.pickVariantId) : undefined;
    const rival = cur.rivalId ? RIVALS.find((m) => m.id === cur.rivalId) : undefined;
    const guess = guessProfile(cur);
    const note = pick && rival ? rivalNote(pick.variant, rival, cur.answers, prices) : null;
    const concession = note?.rows[0] ? copyOf(lang, `rowname.${note.rows[0]}`) : null;
    const steps = suggestConversation(cur, guess.profile, concession);
    const a = cur.answers;
    const other = pick?.model.channel === 'arena' ? 'nexa' : 'arena';
    const booked = cur.lead.status === 'booked';
    detail = (
      <div className="ex-detail" data-testid="ex-detail" data-session={cur.id}>
        <div className="ex-top">
          <div>
            <span className="eyebrow"><T k="x.ex.guess" /></span>
            <h2><T k={`profile.${guess.profile}`} /></h2>
            <p className="note"><T k={guess.reason} /> <T k="x.ex.guess.note" /></p>
          </div>
          <div className="ex-clock"><span className="eyebrow"><T k="x.ex.clock" /></span><Clock r={cur} now={now} /><span className={`status status-${cur.lead.status}`} data-testid="lead-status"><T k={cur.lead.deleted ? 'x.ex.status.deleted' : `x.ex.status.${cur.lead.status}`} /></span></div>
        </div>
        <div className="ex-cols">
          <section>
            <h3><T k="x.ex.told" /></h3>
            {cur.quick && !a.budget ? <p className="note"><T k="x.ex.told.none" /></p> : (
              <dl className="kv">
                <dt><T k="x.ex.told.budget" /></dt>
                <dd>{a.budget && a.budget !== 'all' ? (a.budget === 'o22' ? <T k="opt.budget.o22" p={{ lo: <UiMoney value={BUDGETS[a.budget].min} /> }} /> : a.budget === 'u10' ? <T k="opt.budget.u10" p={{ hi: <UiMoney value={BUDGETS[a.budget].max} /> }} /> : <T k="opt.budget.band" p={{ lo: <UiMoney value={BUDGETS[a.budget].min} />, hi: <UiMoney value={BUDGETS[a.budget].max} /> }} />) : <T k="opt.budget.all" />}</dd>
                <dt><T k="x.ex.told.km" /></dt><dd>{a.km ? <><Ui>{KM_MID[a.km]}</Ui> <T k="cost.km.unit" /></> : '—'}</dd>
                <dt><T k="x.ex.told.pri" /></dt><dd>{a.priorities.length ? a.priorities.map((p) => copyOf(lang, `pri.${p}`)).join(', ') : '—'}</dd>
                <dt><T k="x.ex.told.riders" /></dt><dd>{a.riders ? <T k={`opt.riders.${a.riders}`} /> : '—'}</dd>
                <dt><T k="x.ex.told.fuel" /></dt><dd>{a.fuel ? <T k={`opt.fuel.${a.fuel}`} /> : '—'}</dd>
              </dl>
            )}
            <h3><T k="x.ex.compared" /></h3>
            <dl className="kv">
              <dt><T k="x.ex.pick" /></dt><dd>{pick ? <>{pick.model.name} {pick.variant.name} · <Fact id={pick.variant.facts.price} /></> : '—'}</dd>
              <dt><T k="x.ex.rival" /></dt><dd>{rival ? `${rival.brand} ${rival.name}` : <T k="x.ex.rival.none" />}</dd>
            </dl>
            <h3><T k="x.ex.consent" /></h3>
            <p data-testid="ex-consent">
              {cur.lead.deleted ? <T k="x.ex.status.deleted" /> : cur.handoff.consent && cur.handoff.phone
                ? <><T k="x.ex.consent.given" /> <strong data-ui data-testid="ex-phone">{booked ? cur.handoff.phone : maskPhone(cur.handoff.phone)}</strong>{!booked && <> <span className="note"><T k="x.ex.phone.masked" /></span></>}</>
                : <T k="x.ex.consent.none" />}
            </p>
            {cur.handoff.slot && <p><T k="x.ex.slot" />: <T k={`slot.${cur.handoff.slot}`} /></p>}
          </section>
          <section>
            <h3><T k="x.ex.questions" /></h3>
            {cur.questions.length === 0 && <p className="note"><T k="x.ex.questions.none" /></p>}
            <ul className="ex-q">
              {cur.questions.map((q, i) => (
                <li key={i} className={q.route !== 'answer' ? 'is-open' : ''} data-route={q.route}>
                  <span data-ui>{q.q || intentById(q.intent ?? '')?.q.en[0] || copyOf(lang, 'x.ex.q.dropped')}</span>
                  {q.route !== 'answer' && <strong><T k={q.route === 'expert' ? 'x.ex.routed' : 'x.ex.unanswered'} /></strong>}
                </li>
              ))}
            </ul>
            <h3><T k="x.ex.talk" /></h3>
            <ol className="ex-talk" data-testid="ex-talk">
              {steps.map((st) => <li key={st.key}><T k={st.key} p={st.params ? Object.fromEntries(Object.entries(st.params).map(([k, v]) => [k, <span data-ui>{v}</span>])) : undefined} /></li>)}
            </ol>
            <p className="rule-line"><T k="x.ex.talk.rule" /></p>
          </section>
        </div>
        <div className="ex-actions">
          <button type="button" className="btn btn-primary" disabled={booked || cur.lead.deleted} onClick={() => setStatus(cur, 'booked')} data-testid="act-confirm"><T k={booked ? 'x.ex.act.confirmed' : 'x.ex.act.confirm'} /></button>
          <button type="button" className="btn" disabled={cur.lead.pledgeExplained} onClick={() => update(cur, (l) => ({ ...l, pledgeExplained: true }))} data-testid="act-pledge"><T k={cur.lead.pledgeExplained ? 'x.ex.act.pledged' : 'x.ex.act.pledge'} /></button>
          <button type="button" className="btn" disabled={cur.lead.referred} onClick={() => update(cur, (l) => ({ ...l, referred: true, status: l.status === 'new' ? 'contacted' : l.status, contactedAt: l.contactedAt ?? Date.now() }))} data-testid="act-refer">
            <T k={cur.lead.referred ? 'x.ex.act.referred' : 'x.ex.act.refer'} p={{ channel: copyOf(lang, `ch.${cur.handoff.crossChannel ? pick?.model.channel ?? other : other}`) }} />
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setLostOpen(!lostOpen)} aria-expanded={lostOpen} data-testid="act-lost"><T k="x.ex.act.lost" /></button>
          {lostOpen && (['price', 'rival', 'later'] as const).map((why) => <button key={why} type="button" className="btn btn-quiet" onClick={() => { setStatus(cur, 'lost', { lostReason: why }); setLostOpen(false); }}><T k={`x.ex.lost.${why}`} /></button>)}
        </div>
      </div>
    );
  }

  return (
    <LangProvider lang="en">
      <FixedStage width={1180} height={820}>
        <Surface className="expert">
          <header className="ex-head">
            <h1><T k="x.ex.title" /> · <span data-ui>[EXPERT NAME]</span></h1>
            <div className="ex-score" aria-label={copyOf(lang, 'x.ex.score.title')}>
              <span className="tag"><T k="x.ex.score.title" /> · <T k="x.ex.score.sample" /></span>
              <span><T k="x.ex.score.leads" />: <Sim value={88} unit="%" seed={SAMPLE_SEED} /></span>
              <span><T k="x.ex.score.drive" />: <Sim value={112} seed={SAMPLE_SEED} /></span>
              <span><T k="x.ex.score.ntb" />: <Sim value={31} unit="%" seed={SAMPLE_SEED} /></span>
            </div>
          </header>
          <div className="ex-body">
            <nav className="ex-queue" aria-label={copyOf(lang, 'x.ex.queue')}>
              <h2><T k="x.ex.queue" /></h2>
              <ul>
                {all.map((r) => {
                  const pick = r.pickVariantId ? lookup(r.pickVariantId) : undefined;
                  const g = guessProfile(r);
                  return (
                    <li key={r.id}>
                      <button type="button" className={`ex-card${cur?.id === r.id ? ' is-on' : ''}`} onClick={() => setSelected(r.id)} data-testid={`ex-card-${r.sample ? 'sample' : 'live'}`}>
                        <span className={`tag ${r.sample ? '' : 'tag-live'}`}><T k={r.sample ? 'x.ex.sample' : 'x.ex.live'} /> · <T k="x.ex.kiosk" /> <T k={`ch.${r.channel === 'pod' ? 'nexa' : r.channel}`} /></span>
                        <strong><T k={`profile.${g.profile}`} /></strong>
                        <span>{pick ? `${pick.model.name} ${pick.variant.name}` : '—'}</span>
                        <span className="note"><T k="x.ex.rival" />: {r.rivalId ? modelById(r.rivalId)?.name : <T k="x.ex.rival.none" />}</span>
                        <Clock r={r} now={now} plain />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <main className="ex-main">{detail}</main>
          </div>
          <Footer />
        </Surface>
      </FixedStage>
    </LangProvider>
  );
}
