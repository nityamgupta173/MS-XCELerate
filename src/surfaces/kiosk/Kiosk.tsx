import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Languages, Maximize, RotateCcw } from 'lucide-react';
import type { Channel } from '../../data';
import { patchSession, postControl, publishSession, readSessions, useControl, type ControlMessage } from '../../state/bus';
import { FLOW, HUB, canJump, canNext, initialState, reduce, type KioskEvent, type Step } from '../../state/kioskMachine';
import { COPY, type Lang } from '../../data';
import { FixedStage, Footer, LangProvider, SourcesButton, Surface, T, useText } from '../../ui/core';
import { KioskProvider, anonymise, toRecord, useDerived, useKiosk } from './context';
import { Attract, Language, Match, Needs, Shortlist } from './screensA';
import { Ask, Compare, Costs, Done, Handoff, Promises } from './screensB';
import '../../ui/kiosk.css';

const SCREENS: Record<Step, () => React.ReactNode> = {
  attract: Attract, language: Language, shortlist: Shortlist, needs: Needs, match: Match,
  compare: Compare, ask: Ask, costs: Costs, promises: Promises, handoff: Handoff, done: Done,
};

function Progress() {
  const { s, send } = useKiosk();
  const t = useText();
  return (
    <nav className="progress" aria-label={t('progress.label')}>
      <ol>
        {FLOW.map((step) => {
          const current = s.step === step;
          const done = s.visited.includes(step) && !current;
          return (
            <li key={step}>
              <button type="button" className={`pstep${current ? ' is-current' : ''}${done ? ' is-done' : ''}`} disabled={!canJump(s, step)} aria-current={current ? 'step' : undefined} onClick={() => send({ type: 'GOTO', step })}>
                <T k={`step.${step}`} />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function HubTabs() {
  const { s, send } = useKiosk();
  const go = (step: Step) => (s.visited.includes(step) ? send({ type: 'GOTO', step }) : jumpForward(step));
  const jumpForward = (step: Step) => {
    // Walk forward through NEXT so every state in between is a legal transition.
    let i = FLOW.indexOf(s.step);
    const end = FLOW.indexOf(step);
    while (i < end) { send({ type: 'NEXT' }); i++; }
    while (i > end) { send({ type: 'BACK' }); i--; }
  };
  return (
    <div className="hubtabs">
      {HUB.map((step) => (
        <button key={step} type="button" aria-current={s.step === step ? 'page' : undefined} className={`hubtab${s.step === step ? ' is-on' : ''}`} onClick={() => s.step !== step && go(step)}>
          <T k={`step.${step}`} />
        </button>
      ))}
      <button type="button" className="hubtab hubtab-go" onClick={() => go('handoff')}><T k="step.handoff" /></button>
    </div>
  );
}

function IdleOverlay({ seconds, onContinue }: { seconds: number; onContinue: () => void }) {
  return (
    <div className="idle" role="alertdialog" aria-modal="true" aria-labelledby="idle-title" data-testid="idle">
      <h2 id="idle-title"><T k="idle.title" /></h2>
      <p><T k="idle.body" p={{ s: { ui: seconds } }} /></p>
      <button type="button" className="btn btn-primary btn-xl" onClick={onContinue}><T k="idle.continue" /></button>
    </div>
  );
}

export default function KioskRoute() {
  const [params] = useSearchParams();
  const raw = params.get('channel');
  const channel: Channel = raw === 'arena' || raw === 'pod' ? raw : 'nexa';
  // Test hooks: shorten the idle timings (?idle=3&warn=2&done=3). Defaults are the specified 45 s / 15 s / 20 s.
  const idleS = Number(params.get('idle')) || 45;
  const warnS = Number(params.get('warn')) || 15;
  const doneS = Number(params.get('done')) || 20;
  const [s, send] = useReducer(reduce, channel, (c) => initialState(c));
  const d = useDerived(s);
  const [tour, setTour] = useState(false);
  const [count, setCount] = useState(warnS);
  const [doneCount, setDoneCount] = useState(doneS);
  const lastInput = useRef(Date.now());
  const latest = useRef({ s, d });
  latest.current = { s, d };

  // Wipe: anonymise what was published unless the buyer handed off, then reset everything.
  const wipe = useCallback((note: boolean) => {
    const cur = latest.current.s;
    if (cur.step !== 'attract') patchSession(cur.sessionId, anonymise);
    send({ type: 'RESET', note });
  }, []);

  // Publish the session for the tablet and the council.
  useEffect(() => {
    if (s.step === 'attract') return;
    publishSession(toRecord(s, d, readSessions()[s.sessionId]));
  }, [s, d]);
  useEffect(() => {
    postControl({ to: 'demo', kind: 'kiosk', step: s.step, channel: s.channel, payload: s.step === 'attract' ? null : d.payload, mode: s.handoff.mode, lang: s.lang });
  }, [s.step, s.channel, s.handoff.mode, s.lang, d.payload]);

  // Remote control from judge mode.
  const onControl = useCallback((m: ControlMessage) => {
    if (m.to === 'all' && m.kind === 'reset') send({ type: 'RESET' });
    if (m.to !== 'kiosk') return;
    lastInput.current = Date.now();
    if (m.kind === 'event') { if (m.event.type === 'RESET') wipe(false); else send(m.event); }
    if (m.kind === 'hydrate') send({ type: 'HYDRATE', state: m.state });
    if (m.kind === 'tour') setTour(m.on);
  }, [wipe]);
  useControl(onControl);

  // Idle: 45 s without input -> "Still there?" with a 15 s countdown -> wipe.
  useEffect(() => {
    if (s.step === 'attract' || s.step === 'done' || tour) return;
    const id = window.setInterval(() => {
      const idle = (Date.now() - lastInput.current) / 1000;
      if (!latest.current.s.idleWarning) { if (idle >= idleS) { setCount(warnS); send({ type: 'IDLE_WARN' }); } }
      else {
        const left = Math.ceil(idleS + warnS - idle);
        setCount(Math.max(left, 0));
        if (left <= 0) wipe(true);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [s.step, tour, idleS, warnS, wipe]);
  useEffect(() => {
    if (s.step !== 'done' || tour) return;
    const started = Date.now();
    setDoneCount(doneS);
    const id = window.setInterval(() => {
      const left = Math.ceil(doneS - (Date.now() - started) / 1000);
      setDoneCount(Math.max(left, 0));
      if (left <= 0) wipe(false);
    }, 250);
    return () => window.clearInterval(id);
  }, [s.step, tour, doneS, wipe]);

  // Kiosk hardening: no context menu, keep the screen awake where the browser allows it.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => {});
    document.documentElement.lang = s.lang;
    return () => { document.removeEventListener('contextmenu', block); void lock?.release().catch(() => {}); };
  }, [s.lang]);

  const dispatch = useCallback((e: KioskEvent) => { lastInput.current = Date.now(); if (e.type === 'RESET') wipe(Boolean(e.note)); else send(e); }, [wipe]);
  const touch = () => { lastInput.current = Date.now(); };
  const Screen = SCREENS[s.step];
  const framed = s.step !== 'attract';
  const inHub = HUB.includes(s.step);
  const t = useTextFor(s.lang);

  return (
    <LangProvider lang={s.lang}>
      <KioskProvider value={{ s, send: dispatch, ...d }}>
        <FixedStage width={1080} height={1920} className={`skin-${s.channel}`}>
          <Surface className={`kiosk skin-${s.channel}${s.lang === 'hi' ? ' is-hi' : ''}`} sheet="bottom">
            <div className="kiosk-root" data-step={s.step} data-needs={s.step === 'needs' ? s.needsIndex : undefined} data-session={s.sessionId} onPointerDown={touch} onKeyDown={touch}>
              {framed && (
                <header className="khead">
                  <div className="kbrand"><strong><T k="brand.title" /></strong><span><T k={`channel.${s.channel}`} /></span></div>
                  <button type="button" className="btn btn-quiet" onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})} aria-label={t('nav.fullscreen')}><Maximize aria-hidden /></button>
                  <button type="button" className="btn btn-quiet" onClick={() => dispatch({ type: 'RESET' })}><RotateCcw aria-hidden /><T k="nav.startOver" /></button>
                </header>
              )}
              {framed && s.step !== 'done' && s.step !== 'language' && <Progress />}
              <main className={`kmain kmain-${s.step}`}><Screen /></main>
              {framed && inHub && <HubTabs />}
              {framed && s.step !== 'done' && (
                <div className="kbar">
                  <button type="button" className="btn" onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft aria-hidden /><T k="nav.back" /></button>
                  <button type="button" className="btn btn-quiet" onClick={() => dispatch({ type: 'RESET' })} data-testid="startover"><RotateCcw aria-hidden /><T k="nav.startOver" /></button>
                  <button type="button" className="btn btn-quiet" onClick={() => dispatch({ type: 'SET_LANG', lang: s.lang === 'en' ? 'hi' : 'en' })} data-testid="lang" lang={s.lang === 'en' ? 'hi' : 'en'}>
                    <Languages aria-hidden /><T k={s.lang === 'en' ? 'lang.hi' : 'lang.en'} />
                  </button>
                  <SourcesButton className="btn btn-quiet" />
                  {s.step !== 'handoff' && s.step !== 'language' && (
                    <button type="button" className="btn btn-primary" disabled={!canNext(s)} onClick={() => dispatch({ type: 'NEXT' })} data-testid="next"><T k="nav.next" /><ArrowRight aria-hidden /></button>
                  )}
                </div>
              )}
              {s.step === 'done' && <p className="done-count"><T k="done.auto" p={{ s: { ui: doneCount } }} /></p>}
              <Footer />
              {s.idleWarning && <IdleOverlay seconds={count} onContinue={() => dispatch({ type: 'CONTINUE' })} />}
            </div>
          </Surface>
        </FixedStage>
      </KioskProvider>
    </LangProvider>
  );
}

const useTextFor = (lang: Lang) => (key: string) => COPY[lang][key] ?? COPY.en[key] ?? key;
