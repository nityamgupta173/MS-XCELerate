import { describe, expect, it } from 'vitest';
import { EDGES, FLOW, NEEDS, TRANSITIONS, accepts, canNext, initialState, reduce, type KioskEvent, type KioskState } from '../../src/state/kioskMachine';

const run = (s: KioskState, events: KioskEvent[]) => events.reduce(reduce, s);
const N: KioskEvent = { type: 'NEXT' };
const toMatch: KioskEvent[] = [
  { type: 'START' }, N, { type: 'TOGGLE_RIVAL', id: 'hy' }, N,
  { type: 'ANSWER_BUDGET', value: 'b18_22' }, N, { type: 'ANSWER_KM', value: 'k2500' }, N,
  { type: 'TOGGLE_PRIORITY', value: 'resale' }, N, { type: 'ANSWER_RIDERS', value: 'few' }, N, { type: 'ANSWER_FUEL', value: 'hybrid' }, N,
  { type: 'ANSWER_AGE', value: null },
];

describe('kiosk state machine', () => {
  it('walks the whole flow in order', () => {
    let s = run(initialState('nexa'), toMatch);
    expect(s.step).toBe('match');
    for (const next of ['compare', 'ask', 'costs', 'promises', 'handoff']) { s = reduce(s, N); expect(s.step).toBe(next); }
    s = reduce(s, { type: 'COMPLETE' });
    expect(s.step).toBe('done');
    expect(reduce(s, { type: 'RESET' }).step).toBe('attract');
  });
  it('every documented edge names real states, and every state appears in the table', () => {
    const states = Object.keys(TRANSITIONS);
    for (const [from, , to] of EDGES) { expect(states).toContain(from); expect(states).toContain(to); }
    for (const step of FLOW) expect(states).toContain(step);
    expect(NEEDS).toHaveLength(6);
  });
  it('ignores events a state does not accept', () => {
    const s = initialState('nexa');
    expect(reduce(s, { type: 'SEND' })).toBe(s);
    expect(reduce(s, { type: 'ASK', question: { q: 'x', intent: null, route: 'unanswered', lang: 'en', at: 0 } })).toBe(s);
    expect(accepts('attract', 'START')).toBe(true);
    expect(accepts('done', 'NEXT')).toBe(false);
  });
  it('will not move on until the question is answered', () => {
    const s = run(initialState('nexa'), [{ type: 'START' }, N]);
    expect(s.step).toBe('shortlist');
    expect(canNext(s)).toBe(false);
    expect(reduce(s, N).step).toBe('shortlist');
    expect(reduce(reduce(s, { type: 'NOT_SURE' }), N).step).toBe('needs');
  });
  it('allows at most two rivals and two priorities', () => {
    let s = run(initialState('nexa'), [{ type: 'START' }, N, { type: 'TOGGLE_RIVAL', id: 'hy' }, { type: 'TOGGLE_RIVAL', id: 'cr' }, { type: 'TOGGLE_RIVAL', id: 'sel' }]);
    expect(s.answers.shortlist).toEqual(['hy', 'cr']);
    s = run(s, [N, { type: 'ANSWER_BUDGET', value: 'all' }, N, { type: 'ANSWER_KM', value: 'k800' }, N, { type: 'TOGGLE_PRIORITY', value: 'safety' }, { type: 'TOGGLE_PRIORITY', value: 'design' }, { type: 'TOGGLE_PRIORITY', value: 'running' }]);
    expect(s.answers.priorities).toEqual(['safety', 'design']);
    expect(s.calc.km).toBe(600);
  });
  it('wipe: RESET returns a clean state with a new session and no typed number', () => {
    let s = run(initialState('arena'), [...toMatch, { type: 'HANDOFF_MODE', mode: 'phone' }, { type: 'KEY_DIGIT', digit: '9' }, { type: 'KEY_DIGIT', digit: '8' }]);
    expect(s.handoff.phone).toBe('98');
    const before = s.sessionId;
    s = reduce(s, { type: 'RESET', note: true });
    expect(s).toMatchObject({ step: 'attract', channel: 'arena', lang: 'en', wipedNote: true, questions: [], visited: [] });
    expect(s.handoff).toMatchObject({ phone: '', consent: false, sent: false });
    expect(s.answers).toMatchObject({ budget: null, shortlist: [], priorities: [] });
    expect(s.sessionId).not.toBe(before);
  });
  it('consent: Send does nothing until the number is valid and the box is ticked', () => {
    let s = run(initialState('nexa'), [...toMatch, { type: 'HANDOFF_MODE', mode: 'phone' }]);
    expect(s.handoff.consent).toBe(false);
    for (const d of '9000000000') s = reduce(s, { type: 'KEY_DIGIT', digit: d });
    expect(reduce(s, { type: 'SEND' }).handoff.sent).toBe(false);
    s = reduce(s, { type: 'TOGGLE_CONSENT' });
    s = reduce(s, { type: 'SEND' });
    expect(s.handoff.sent).toBe(true);
    expect(reduce(s, { type: 'KEY_DIGIT', digit: '1' }).handoff.phone).toBe('9000000000');
  });
  it('the idle overlay blocks everything except Continue and the wipe', () => {
    let s = run(initialState('nexa'), toMatch);
    s = reduce(s, { type: 'IDLE_WARN' });
    expect(s.idleWarning).toBe(true);
    expect(reduce(s, N).step).toBe('match');
    expect(reduce(s, { type: 'CONTINUE' }).idleWarning).toBe(false);
    expect(reduce(initialState('nexa'), { type: 'IDLE_WARN' }).idleWarning).toBe(false);
  });
  it('switching language keeps the session', () => {
    const s = run(initialState('nexa'), toMatch);
    const hi = reduce(s, { type: 'SET_LANG', lang: 'hi' });
    expect(hi).toMatchObject({ lang: 'hi', step: 'match', answers: s.answers, sessionId: s.sessionId });
  });
  it('a completed step can be jumped back to, an unvisited one cannot', () => {
    const s = run(initialState('nexa'), toMatch);
    expect(reduce(s, { type: 'GOTO', step: 'shortlist' }).step).toBe('shortlist');
    expect(reduce(s, { type: 'GOTO', step: 'costs' }).step).toBe('match');
  });
});
