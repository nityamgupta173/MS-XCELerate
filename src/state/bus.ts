import { useEffect, useState } from 'react';
import type { SessionRecord } from '../domain/types';
import type { KioskEvent, KioskState } from './kioskMachine';

/**
 * SessionBus. localStorage is the shared record (so a reload keeps the demo queue);
 * BroadcastChannel tells the other surfaces something changed. Where BroadcastChannel
 * is missing, the browser's own `storage` event does the same job across tabs.
 */
const SESSIONS = 'hg.sessions.v2';
const CONTROL = 'hg.control.v2';

export type ControlMessage =
  | { to: 'kiosk'; kind: 'event'; event: KioskEvent }
  | { to: 'kiosk'; kind: 'hydrate'; state: Partial<KioskState> }
  | { to: 'kiosk'; kind: 'tour'; on: boolean }
  | { to: 'all'; kind: 'reset' }
  | { to: 'demo'; kind: 'kiosk'; step: string; channel: string; payload: string | null; mode: string | null; lang: string };

type Wire = { t: 'sessions' } | { t: 'control'; m: ControlMessage };
const channel: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('hg-session-bus') : null;
const listeners = new Set<(w: Wire) => void>();
const emit = (w: Wire) => listeners.forEach((l) => l(w));
channel?.addEventListener('message', (e: MessageEvent<Wire>) => emit(e.data));
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SESSIONS) emit({ t: 'sessions' });
    if (e.key === CONTROL && e.newValue && !channel) {
      try { emit({ t: 'control', m: (JSON.parse(e.newValue) as { m: ControlMessage }).m }); } catch { /* ignore a malformed message */ }
    }
  });
}
function send(w: Wire) {
  emit(w);
  if (channel) channel.postMessage(w);
  else if (w.t === 'control') { try { localStorage.setItem(CONTROL, JSON.stringify({ m: w.m, at: Date.now() })); } catch { /* storage unavailable */ } }
}

export function readSessions(): Record<string, SessionRecord> {
  try { return JSON.parse(localStorage.getItem(SESSIONS) ?? '{}') as Record<string, SessionRecord>; } catch { return {}; }
}
function save(all: Record<string, SessionRecord>) {
  try { localStorage.setItem(SESSIONS, JSON.stringify(all)); } catch { /* storage unavailable */ }
  send({ t: 'sessions' });
}
export function publishSession(rec: SessionRecord) {
  const all = readSessions();
  const prev = all[rec.id];
  // The tablet owns the lead fields; the kiosk owns the rest.
  all[rec.id] = prev ? { ...rec, lead: prev.lead } : rec;
  save(all);
}
export function patchSession(id: string, fn: (r: SessionRecord) => SessionRecord) {
  const all = readSessions();
  if (!all[id]) return;
  all[id] = fn(all[id]);
  save(all);
}
export function clearSessions() {
  save({});
}

export function useSessions(): SessionRecord[] {
  const [all, setAll] = useState(readSessions);
  useEffect(() => {
    const l = (w: Wire) => { if (w.t === 'sessions') setAll(readSessions()); };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
}

export const postControl = (m: ControlMessage) => send({ t: 'control', m });
export function useControl(handler: (m: ControlMessage) => void) {
  useEffect(() => {
    const l = (w: Wire) => { if (w.t === 'control') handler(w.m); };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, [handler]);
}
