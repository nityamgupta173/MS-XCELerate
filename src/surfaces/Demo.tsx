import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { Channel } from '../data';
import { ask } from '../domain/qa';
import { EMPTY_ANSWERS, type Answers } from '../domain/types';
import { clearSessions, postControl, useControl, type ControlMessage } from '../state/bus';
import { FLOW, type KioskEvent, type KioskState } from '../state/kioskMachine';
import { Footer, LangProvider, Surface, T, Ui } from '../ui/core';
import '../ui/rest.css';

type Tab = 'tablet' | 'council';
type TourId = 'upgrader' | 'family' | 'stylist';
interface TourStep { cap: string; events: KioskEvent[]; focus?: Tab | 'phone' }

const q = (text: string, lang: 'en' | 'hi' = 'en'): KioskEvent => {
  const r = ask(text);
  return { type: 'ASK', question: { q: text, intent: r.intent?.id ?? null, route: r.route, lang, at: Date.now() } };
};
const N: KioskEvent = { type: 'NEXT' };
const digits = (s: string): KioskEvent[] => s.split('').map((d) => ({ type: 'KEY_DIGIT', digit: d }));

const TOURS: Record<TourId, { channel: Channel; steps: TourStep[] }> = {
  upgrader: {
    channel: 'nexa',
    steps: [
      { cap: 'x.de.u.1', events: [{ type: 'START' }, N] },
      { cap: 'x.de.u.2', events: [{ type: 'TOGGLE_RIVAL', id: 'hy' }, { type: 'TOGGLE_RIVAL', id: 'sel' }, N] },
      { cap: 'x.de.u.3', events: [{ type: 'ANSWER_BUDGET', value: 'b18_22' }, N, { type: 'ANSWER_KM', value: 'k2500' }, N, { type: 'TOGGLE_PRIORITY', value: 'resale' }, { type: 'TOGGLE_PRIORITY', value: 'design' }, N, { type: 'ANSWER_RIDERS', value: 'few' }, N, { type: 'ANSWER_FUEL', value: 'hybrid' }, N, { type: 'ANSWER_AGE', value: 'a35_44' }] },
      { cap: 'x.de.u.4', events: [] },
      { cap: 'x.de.u.5', events: [N, { type: 'SET_GROUP', group: 'ownership' }] },
      { cap: 'x.de.u.6', events: [N, q('Is the Toyota warranty longer?')] },
      { cap: 'x.de.u.7', events: [N, N] },
      { cap: 'x.de.u.8', events: [{ type: 'HANDOFF_MODE', mode: 'book' }, { type: 'PICK_SLOT', slot: 'sat1' }, { type: 'BOOK' }, { type: 'BACK' }, { type: 'HANDOFF_MODE', mode: 'talk' }, { type: 'TALK' }] },
      { cap: 'x.de.u.9', events: [], focus: 'tablet' },
    ],
  },
  family: {
    channel: 'arena',
    steps: [
      { cap: 'x.de.f.1', events: [{ type: 'START' }, { type: 'SET_LANG', lang: 'hi' }, N] },
      { cap: 'x.de.f.2', events: [{ type: 'TOGGLE_RIVAL', id: 'nx' }, N] },
      { cap: 'x.de.f.3', events: [{ type: 'ANSWER_BUDGET', value: 'b10_14' }, N, { type: 'ANSWER_KM', value: 'k1500' }, N, { type: 'TOGGLE_PRIORITY', value: 'safety' }, { type: 'TOGGLE_PRIORITY', value: 'running' }, N, { type: 'ANSWER_RIDERS', value: 'family' }, N, { type: 'ANSWER_FUEL', value: 'cng' }, N, { type: 'ANSWER_AGE', value: null }] },
      { cap: 'x.de.f.4', events: [] },
      { cap: 'x.de.f.5', events: [N, { type: 'SET_GROUP', group: 'safety' }] },
      { cap: 'x.de.f.6', events: [N, q('क्या Nexon, Brezza से ज़्यादा सुरक्षित है?', 'hi')] },
      { cap: 'x.de.f.7', events: [N] },
      { cap: 'x.de.f.8', events: [N, { type: 'SET_PROMISE_TAB', tab: 'pledge' }] },
      { cap: 'x.de.f.9', events: [{ type: 'HANDOFF_MODE', mode: 'phone' }, ...digits('9000000000'), { type: 'TOGGLE_CONSENT' }, { type: 'SEND' }], focus: 'tablet' },
    ],
  },
  stylist: {
    channel: 'nexa',
    steps: [
      { cap: 'x.de.s.1', events: [{ type: 'START' }, N] },
      { cap: 'x.de.s.2', events: [{ type: 'NOT_SURE' }, N] },
      { cap: 'x.de.s.3', events: [{ type: 'ANSWER_BUDGET', value: 'u10' }, N, { type: 'ANSWER_KM', value: 'k1500' }, N, { type: 'TOGGLE_PRIORITY', value: 'design' }, { type: 'TOGGLE_PRIORITY', value: 'running' }, N, { type: 'ANSWER_RIDERS', value: 'few' }, N, { type: 'ANSWER_FUEL', value: 'cng' }, N, { type: 'ANSWER_AGE', value: 'u25' }] },
      { cap: 'x.de.s.4', events: [] },
      { cap: 'x.de.s.5', events: [N, N, N] },
      { cap: 'x.de.s.6', events: [{ type: 'BACK' }, q('Any discount or offers?')] },
      { cap: 'x.de.s.7', events: [N, N, N, { type: 'HANDOFF_MODE', mode: 'qr' }], focus: 'phone' },
      { cap: 'x.de.s.8', events: [], focus: 'phone' },
    ],
  },
};

const A = (a: Partial<Answers>): Answers => ({ ...EMPTY_ANSWERS, ...a });
const emptyHandoff: KioskState['handoff'] = { mode: null, phone: '', consent: false, sent: false, slot: null, booked: false, talked: false, scanned: false, at: null };
const jump = (s: Partial<KioskState>): Partial<KioskState> => ({ visited: FLOW, quick: false, sibling: false, notSure: false, lang: 'en', wipedNote: false, pickVariantId: null, rivalVariantId: null, questions: [], handoff: emptyHandoff, ...s });
/** For each claim: the kiosk state that proves it, and which side panel to look at. */
const CLAIMS: Array<{ state?: Partial<KioskState>; tab?: Tab }> = [
  { state: jump({ channel: 'nexa', step: 'compare', group: 'ownership', rivalId: 'cr', answers: A({ budget: 'b18_22', km: 'k2500', priorities: ['running', 'resale'], riders: 'few', fuel: 'hybrid', shortlist: ['cr'] }) }) },
  { state: jump({ channel: 'nexa', step: 'compare', group: 'safety', rivalId: 'cr', pickVariantId: 'gv.delta-at', answers: A({ budget: 'b10_14', km: 'k1500', priorities: ['running'], riders: 'few', fuel: 'petrol', shortlist: ['cr'] }) }) },
  { state: jump({ channel: 'nexa', step: 'match', rivalId: 'cr', answers: A({ budget: 'b14_18', km: 'k1500', priorities: ['safety', 'running'], riders: 'family', fuel: 'hybrid', shortlist: ['cr'] }) }) },
  { state: jump({ channel: 'nexa', step: 'compare', group: 'ownership', rivalId: 'hy', answers: A({ budget: 'b18_22', km: 'k2500', priorities: ['resale', 'design'], riders: 'few', fuel: 'hybrid', shortlist: ['hy'] }) }) },
  { state: jump({ channel: 'nexa', step: 'handoff', rivalId: 'hy', answers: A({ budget: 'b18_22', km: 'k2500', priorities: ['resale', 'design'], riders: 'few', fuel: 'hybrid', shortlist: ['hy'] }), handoff: { ...emptyHandoff, mode: 'talk', talked: true, at: Date.now() } }), tab: 'tablet' },
  { state: jump({ channel: 'arena', step: 'handoff', rivalId: 'nx', answers: A({ budget: 'b10_14', km: 'k1500', priorities: ['safety', 'running'], riders: 'family', fuel: 'cng', shortlist: ['nx'] }), handoff: { ...emptyHandoff, mode: 'phone' } }) },
  { tab: 'council' },
];

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const EVENT_GAP = 420;
const DWELL = 6000;

export default function Demo() {
  const [tab, setTab] = useState<Tab>('tablet');
  const [channel, setChannel] = useState<Channel>('nexa');
  const [payload, setPayload] = useState<string | null>(null);
  const [tour, setTour] = useState<TourId | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [claim, setClaim] = useState<number | null>(null);
  const run = useRef({ token: 0, pause: false });

  const onControl = useCallback((m: ControlMessage) => {
    if (m.to !== 'demo') return;
    setChannel(m.channel as Channel);
    if (m.payload && (m.mode === 'qr' || m.step === 'done' || m.step === 'handoff')) setPayload(m.payload);
  }, []);
  useControl(onControl);

  const toKiosk = (event: KioskEvent) => postControl({ to: 'kiosk', kind: 'event', event });
  const stopTour = useCallback(() => { run.current.token++; setTour(null); setPlaying(false); postControl({ to: 'kiosk', kind: 'tour', on: false }); }, []);

  const playSteps = useCallback(async (id: TourId, from: number, single: boolean) => {
    const my = ++run.current.token;
    run.current.pause = false;
    const steps = TOURS[id].steps;
    setPlaying(!single);
    for (let i = from; i < steps.length; i++) {
      const st = steps[i]!;
      setStep(i);
      for (const event of st.events) { if (run.current.token !== my) return; toKiosk(event); await sleep(EVENT_GAP); }
      if (st.focus === 'tablet' || st.focus === 'council') setTab(st.focus);
      if (single) return;
      await sleep(DWELL);
      if (run.current.token !== my) return;
      if (run.current.pause) { setPlaying(false); return; }
    }
    setPlaying(false);
  }, []);

  const startTour = useCallback(async (id: TourId) => {
    run.current.token++;
    setClaim(null); setTour(id); setStep(0); setPayload(null); setTab('tablet');
    postControl({ to: 'kiosk', kind: 'tour', on: true });
    postControl({ to: 'kiosk', kind: 'hydrate', state: { channel: TOURS[id].channel } });
    toKiosk({ type: 'RESET' });
    await sleep(500);
    void playSteps(id, 0, false);
  }, [playSteps]);

  const nextStep = () => { if (!tour) return; const n = Math.min(step + 1, TOURS[tour].steps.length - 1); if (n !== step) void playSteps(tour, n, true); };
  const togglePlay = () => {
    if (!tour) return;
    if (playing) { run.current.pause = true; setPlaying(false); }
    else if (step < TOURS[tour].steps.length - 1) void playSteps(tour, step + 1, false);
  };
  const resetAll = () => { stopTour(); setClaim(null); setPayload(null); clearSessions(); postControl({ to: 'all', kind: 'reset' }); };
  const showClaim = (i: number) => {
    stopTour();
    setClaim(i);
    const c = CLAIMS[i]!;
    if (c.state) { toKiosk({ type: 'RESET' }); window.setTimeout(() => postControl({ to: 'kiosk', kind: 'hydrate', state: { ...c.state, startedAt: Date.now() } }), 150); }
    if (c.tab) setTab(c.tab);
  };
  const setKioskChannel = (c: Channel) => { stopTour(); setClaim(null); postControl({ to: 'kiosk', kind: 'hydrate', state: { channel: c } }); toKiosk({ type: 'RESET' }); };
  useEffect(() => () => { run.current.token++; }, []);

  const total = tour ? TOURS[tour].steps.length : 0;
  const caption = tour ? TOURS[tour].steps[step]!.cap : claim !== null ? `x.de.claim.${claim + 1}.cap` : 'x.de.caption.idle';

  return (
    <LangProvider lang="en">
      <Surface className="demo">
        <header className="de-head">
          <div className="de-title">
            <h1><T k="x.de.header" /></h1>
            <p><T k="x.de.sub" /></p>
          </div>
          <ol className="claims">
            {CLAIMS.map((_, i) => (
              <li key={i}><button type="button" className={`claim${claim === i ? ' is-on' : ''}`} onClick={() => showClaim(i)} data-testid={`claim-${i + 1}`}><span className="claim-n"><Ui>{i + 1}</Ui></span><T k={`x.de.claim.${i + 1}`} /></button></li>
            ))}
          </ol>
        </header>
        <div className="de-bar">
          <div className="de-tours">
            <span className="tag"><T k="x.de.tour" /></span>
            {(Object.keys(TOURS) as TourId[]).map((id) => <button key={id} type="button" className={`btn${tour === id ? ' btn-primary' : ''}`} onClick={() => void startTour(id)} data-testid={`tour-${id}`}><Play aria-hidden /><T k={`x.de.tour.${id}`} /></button>)}
          </div>
          <div className="de-controls">
            {tour && (<>
              <span className="tag" data-testid="tour-step"><T k="x.de.stepOf" p={{ i: { ui: step + 1 }, n: { ui: total } }} /></span>
              <button type="button" className="btn" onClick={togglePlay} data-testid="tour-toggle">{playing ? <Pause aria-hidden /> : <Play aria-hidden />}<T k={playing ? 'x.de.pause' : 'x.de.play'} /></button>
              <button type="button" className="btn" onClick={nextStep} disabled={step >= total - 1} data-testid="tour-next"><SkipForward aria-hidden /><T k="x.de.step" /></button>
              <button type="button" className="btn" onClick={() => void startTour(tour)}><RotateCcw aria-hidden /><T k="x.de.restart" /></button>
              <button type="button" className="btn btn-quiet" onClick={stopTour}><T k="x.de.stop" /></button>
            </>)}
            <button type="button" className="btn btn-quiet" onClick={resetAll} data-testid="reset-all"><T k="x.de.reset" /></button>
          </div>
        </div>
        <p className="de-caption" role="status" data-testid="caption"><T k={caption} /></p>
        <main className="de-main">
          <section className="de-kiosk" aria-label="Floor kiosk">
            <div className="de-label">
              <span><T k="x.de.frame.kiosk" /></span>
              <span className="de-switch"><T k="x.de.kioskAt" />{(['nexa', 'arena', 'pod'] as Channel[]).map((c) => <button key={c} type="button" className={`mini${channel === c ? ' is-on' : ''}`} onClick={() => setKioskChannel(c)} data-testid={`ch-${c}`}><T k={c === 'pod' ? 'channel.pod' : `ch.${c}`} /></button>)}</span>
            </div>
            <div className="bezel bezel-kiosk"><iframe title="Floor kiosk" src="/kiosk?channel=nexa&embed=1" data-testid="frame-kiosk" /></div>
          </section>
          <section className="de-phone" aria-label="Buyer's phone">
            <div className="de-label"><span><T k="x.de.frame.phone" /></span>{payload && <a href={`/m#${payload}`} target="_blank" rel="noreferrer"><T k="x.de.open" /></a>}</div>
            <div className="bezel bezel-phone">
              {payload ? <iframe key={payload} title="Buyer's phone" src={`/m#${payload}`} data-testid="frame-phone" /> : <p className="empty"><T k="x.de.phone.empty" /></p>}
            </div>
          </section>
          <section className="de-side" aria-label="Staff views">
            <div className="de-label">
              {(['tablet', 'council'] as Tab[]).map((t) => <button key={t} type="button" aria-pressed={tab === t} className={`mini${tab === t ? ' is-on' : ''}`} onClick={() => setTab(t)} data-testid={`tab-${t}`}><T k={`x.de.tab.${t}`} /></button>)}
              <a href={tab === 'tablet' ? '/expert' : '/council'} target="_blank" rel="noreferrer"><T k="x.de.open" /></a>
            </div>
            <div className={`bezel bezel-${tab}`}>
              <iframe title="Product expert's tablet" src="/expert" hidden={tab !== 'tablet'} data-testid="frame-tablet" />
              <iframe title="SUV Council dashboard" src="/council" hidden={tab !== 'council'} data-testid="frame-council" />
            </div>
          </section>
        </main>
        <div className="de-foot"><Link to="/about"><T k="x.de.about" /></Link><Footer /></div>
      </Surface>
    </LangProvider>
  );
}
