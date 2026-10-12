import { useMemo, useState, type ReactNode } from 'react';
import { RIVALS, num } from '../data';
import { CITIES, FUNNEL_STAGES, SIM_SEED, simulate, type City, type Profile, type SimRow } from '../domain/simulate';
import { useSessions } from '../state/bus';
import { Footer, LangProvider, Sim, Surface, T, Ui, copyOf } from '../ui/core';
import '../ui/rest.css';

const S = (p: { v: number; unit?: string; plain?: boolean }) => <Sim value={p.v} unit={p.unit} seed={SIM_SEED} plain={p.plain} />;
const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
const sum = (rows: SimRow[], f: (r: SimRow) => number) => rows.reduce((t, r) => t + f(r), 0);

function Tile({ title, tag, children, wide, testid }: { title: ReactNode; tag: ReactNode; children: ReactNode; wide?: boolean; testid?: string }) {
  return (
    <section className={`tile${wide ? ' tile-wide' : ''}`} data-testid={testid}>
      <header><h2>{title}</h2><span className="tag">{tag}</span></header>
      {children}
    </section>
  );
}
/** A labelled horizontal bar. The label and the value are text, so nothing depends on colour. */
function Bar({ label, value, max, children, tone }: { label: ReactNode; value: number; max: number; children: ReactNode; tone?: string }) {
  return (
    <div className="bar">
      <span className="bar-label">{label}</span>
      <span className="bar-track"><span className={`bar-fill ${tone ?? ''}`} style={{ width: `${Math.max(pct(value, max), 0.5)}%` }} /></span>
      <span className="bar-value">{children}</span>
    </div>
  );
}

export default function Council() {
  const lang = 'en' as const;
  const sim = useMemo(() => simulate(), []);
  const live = useSessions();
  const [city, setCity] = useState<City | 'all'>('all');
  const [channel, setChannel] = useState<'nexa' | 'arena' | 'all'>('all');
  const [outlet, setOutlet] = useState('all');
  const [week, setWeek] = useState<number | 'all'>('all');
  const outlets = [...new Set(sim.rows.filter((r) => (city === 'all' || r.city === city) && (channel === 'all' || r.channel === channel)).map((r) => r.outlet))];
  const rows = sim.rows.filter((r) => (city === 'all' || r.city === city) && (channel === 'all' || r.channel === channel) && (outlet === 'all' || r.outlet === outlet) && (week === 'all' || r.week === week));
  const share = rows.length / sim.rows.length;
  const outletName = (id: string) => { const [c, ch, n] = id.split('-'); return `${copyOf(lang, 'x.co.city').replace('{x}', String.fromCharCode(64 + Number(c!.slice(1))))} · ${copyOf(lang, `ch.${ch}`)} ${n}`; };

  const funnel = FUNNEL_STAGES.map((st) => ({ st, n: sum(rows, (r) => r.funnel[st]) }));
  const start = funnel[0]!.n;
  const rivalIds = ['hy', 'cr', 'sel', 'nx', 'none'];
  const profiles: Profile[] = ['upgrader', 'family', 'stylist'];
  const mix = rivalIds.map((id) => ({ id, by: profiles.map((p) => sum(rows, (r) => r.rivals[id]?.[p] ?? 0)) }));
  const mixMax = Math.max(...mix.map((m) => m.by.reduce((a, b) => a + b, 0)), 1);
  const byOutlet = outlets.map((id) => { const rs = rows.filter((r) => r.outlet === id); return { id, rate: pct(sum(rs, (r) => r.leadsIn24h), sum(rs, (r) => r.leads)) }; }).sort((a, b) => a.rate - b.rate);
  const floor = num('score.leads.floor')!;
  const target = num('score.leads.target')!;
  const n2a = sum(rows.filter((r) => r.channel === 'nexa'), (r) => r.refOut);
  const a2n = sum(rows.filter((r) => r.channel === 'arena'), (r) => r.refOut);
  const hindi = sum(rows, (r) => r.hindi);
  const pilotRate = pct(sum(rows, (r) => r.funnel.booking), start);
  const controlRate = pct(sum(rows, (r) => r.controlBookings), sum(rows, (r) => r.controlVisitors));
  const liveGaps = live.flatMap((s) => s.questions.filter((q) => q.route === 'unanswered' && q.q));
  const liveStage = (st: string) => live.filter((s) => {
    const order = ['language', 'shortlist', 'needs', 'match', 'compare', 'ask', 'costs', 'promises', 'handoff', 'done'];
    if (st === 'start') return true;
    if (st === 'compare') return order.indexOf(s.furthest) >= order.indexOf('compare');
    if (st === 'ask') return s.questions.length > 0;
    if (st === 'handoff') return s.handoff.mode !== null;
    if (st === 'drive') return s.handoff.mode === 'book' || s.lead.status === 'booked';
    return false; // no car is ever booked in the demo
  }).length;

  const select = (label: string, value: string, set: (v: string) => void, opts: Array<[string, string]>) => (
    <label className="filter"><span>{label}</span>
      <select data-ui value={value} onChange={(e) => set(e.target.value)}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </label>
  );
  const all = copyOf(lang, 'x.co.filter.all');

  return (
    <LangProvider lang="en">
      <Surface className="council">
        <header className="co-head">
          <div><h1><T k="x.co.title" /></h1><p className="banner" data-testid="sim-banner"><strong><T k="x.co.banner" /></strong> <T k="x.co.seed" />: <Ui>{String(SIM_SEED)}</Ui>. <T k="x.co.assume.body" /></p></div>
          <div className="filters">
            {select(copyOf(lang, 'x.co.filter.city'), city, (v) => { setCity(v as City | 'all'); setOutlet('all'); }, [['all', all], ...CITIES.map((c): [string, string] => [c, outletName(`${c}-nexa-1`).split(' · ')[0]!])])}
            {select(copyOf(lang, 'x.co.filter.channel'), channel, (v) => { setChannel(v as 'nexa' | 'arena' | 'all'); setOutlet('all'); }, [['all', all], ['nexa', 'NEXA'], ['arena', 'Arena']])}
            {select(copyOf(lang, 'x.co.filter.outlet'), outlet, setOutlet, [['all', all], ...outlets.map((o): [string, string] => [o, outletName(o)])])}
            {select(copyOf(lang, 'x.co.filter.week'), String(week), (v) => setWeek(v === 'all' ? 'all' : Number(v)), [['all', all], ...Array.from({ length: 8 }, (_, i): [string, string] => [String(i + 1), copyOf(lang, 'x.co.week').replace('{n}', String(i + 1))])])}
          </div>
        </header>
        <main className="co-grid">
          <Tile title={<T k="x.co.funnel" />} tag={<T k="x.co.funnel.tag" />} wide testid="tile-funnel">
            {funnel.map((f) => <Bar key={f.st} label={<T k={`x.co.stage.${f.st}`} />} value={f.n} max={start}><S v={f.n} /> · <S v={pct(f.n, start)} unit="%" plain /></Bar>)}
            <p className="kpi"><T k="x.co.conv" />: <S v={pilotRate} unit="%" /></p>
            <p className="live" data-testid="live-count"><T k="x.co.live" />: <Ui>{live.length}</Ui>{live.length > 0 && FUNNEL_STAGES.map((st) => <span key={st}> · <T k={`x.co.stage.${st}`} /> <Ui>{liveStage(st)}</Ui></span>)}</p>
          </Tile>
          <Tile title={<T k="x.co.rivals" />} tag={<T k="x.co.rivals.tag" />} testid="tile-rivals">
            <table className="mix">
              <thead><tr><th />{profiles.map((p) => <th key={p} scope="col"><T k={`profile.${p}`} /></th>)}</tr></thead>
              <tbody>
                {mix.map((m) => (
                  <tr key={m.id}>
                    <th scope="row">{m.id === 'none' ? <T k="x.co.rival.none" /> : RIVALS.find((r) => r.id === m.id)?.name}</th>
                    {m.by.map((v, i) => <td key={i}><span className="cellbar" style={{ width: `${pct(v, mixMax)}%` }} /><S v={v} plain /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Tile>
          <Tile title={<T k="x.co.leads" />} tag={<T k="x.co.leads.tag" />} testid="tile-leads">
            <p className="legend"><T k="x.co.leads.floor" /> · <T k="x.co.leads.target" /></p>
            <div className="leads">
              {byOutlet.slice(0, 8).map((o) => {
                const state = o.rate < floor ? 'below' : o.rate < target ? 'mid' : 'met';
                return <Bar key={o.id} label={<span data-ui>{outletName(o.id)}</span>} value={o.rate} max={100} tone={`tone-${state}`}><S v={o.rate} unit="%" /> · <T k={`x.co.leads.${state}`} /></Bar>;
              })}
            </div>
          </Tile>
          <Tile title={<T k="x.co.questions" />} tag={<T k="x.co.questions.tag" />} testid="tile-questions">
            {sim.topQuestions.map((q) => <Bar key={q.id} label={<T k={`x.co.q.${q.id}`} />} value={q.count} max={sim.topQuestions[0]!.count}><S v={Math.round(q.count * share)} /></Bar>)}
          </Tile>
          <Tile title={<T k="x.co.gaps" />} tag={<T k="x.co.gaps.tag" />} testid="tile-gaps">
            <ol className="gaps">
              {sim.gaps.map((g) => <li key={g.id}><span><T k={g.id} /></span><span className="meta"><S v={Math.round(g.count * share)} /> · <T k="x.co.gaps.owner" /> · <T k="x.co.gaps.sla" p={{ d: { ui: g.slaDays } }} /></span></li>)}
              {liveGaps.map((q, i) => <li key={`live-${i}`} className="is-live" data-testid="live-gap"><span data-ui>{q.q}</span><span className="meta"><T k="x.co.gaps.live" /> · <T k="x.co.gaps.owner" /></span></li>)}
            </ol>
          </Tile>
          <Tile title={<T k="x.co.refs" />} tag={<T k="x.co.refs.tag" />} testid="tile-refs">
            <div className="pair"><p><span className="big"><S v={n2a} /></span><T k="x.co.refs.n2a" /></p><p><span className="big"><S v={a2n} /></span><T k="x.co.refs.a2n" /></p></div>
            <p className="live"><T k="x.co.live" />: <Ui>{live.filter((s) => s.handoff.crossChannel && s.handoff.mode).length}</Ui></p>
          </Tile>
          <Tile title={<T k="x.co.u35" />} tag={<T k="x.co.u35.tag" />} testid="tile-u35">
            <p><span className="big"><S v={pct(sum(rows, (r) => r.under35), sum(rows, (r) => r.ageKnown))} unit="%" /></span></p>
            <p className="note"><T k="x.co.u35.note" /></p>
          </Tile>
          <Tile title={<T k="x.co.ntb" />} tag={<T k="x.co.ntb.tag" />} testid="tile-ntb">
            <p><span className="big"><S v={pct(sum(rows, (r) => r.newToBrand), sum(rows, (r) => r.funnel.booking))} unit="%" /></span></p>
          </Tile>
          <Tile title={<T k="x.co.lang" />} tag={<T k="x.co.lang.tag" />} testid="tile-lang">
            <Bar label="English" value={start - hindi} max={start}><S v={pct(start - hindi, start)} unit="%" /></Bar>
            <Bar label="हिंदी" value={hindi} max={start}><S v={pct(hindi, start)} unit="%" /></Bar>
          </Tile>
          <Tile title={<T k="x.co.pilot" />} tag={<T k="x.co.pilot.tag" />} wide testid="tile-pilot">
            <Bar label={<T k="x.co.pilot.pilot" />} value={pilotRate} max={Math.max(pilotRate, controlRate)}><S v={pilotRate} unit="%" /></Bar>
            <Bar label={<T k="x.co.pilot.control" />} value={controlRate} max={Math.max(pilotRate, controlRate)} tone="tone-ink"><S v={controlRate} unit="%" /></Bar>
            <p className="kpi"><T k="x.co.pilot.diff" />: <S v={pilotRate - controlRate} unit="pp" /> <abbr title="percentage points">pp</abbr></p>
            <p className="notice"><T k="x.co.pilot.caveat" /></p>
          </Tile>
        </main>
        <Footer />
      </Surface>
    </LangProvider>
  );
}
