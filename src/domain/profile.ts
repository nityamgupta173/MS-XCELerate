import { lookup } from '../data';
import type { SessionRecord } from './types';

export type Profile = 'upgrader' | 'family' | 'stylist';
export interface ProfileGuess {
  profile: Profile;
  /** Copy key explaining the guess. It is a guess, and the tablet says so. */
  reason: string;
}

export function guessProfile(s: Pick<SessionRecord, 'channel' | 'answers' | 'pickVariantId'>): ProfileGuess {
  const model = s.pickVariantId ? lookup(s.pickVariantId)?.model.id : null;
  const a = s.answers;
  if (model === 'frx') return { profile: 'stylist', reason: 'profile.why.fronx' };
  if (a.budget === 'u10' && s.channel !== 'arena') return { profile: 'stylist', reason: 'profile.why.budget' };
  if (model === 'vic' || model === 'brz') return { profile: 'family', reason: 'profile.why.arenaModel' };
  if (a.riders === 'family' && a.priorities.includes('safety')) return { profile: 'family', reason: 'profile.why.familySafety' };
  if (s.channel === 'arena') return { profile: 'family', reason: 'profile.why.arena' };
  return { profile: 'upgrader', reason: a.shortlist.length ? 'profile.why.crossShop' : 'profile.why.default' };
}

export interface ConversationStep {
  key: string;
  params?: Record<string, string>;
}
/** Three rule-generated steps for the product expert, plus the fixed pricing line. */
export function suggestConversation(s: SessionRecord, profile: Profile, concessionRow: string | null): ConversationStep[] {
  const open: Record<Profile, string> = { upgrader: 'talk.open.upgrader', family: 'talk.open.family', stylist: 'talk.open.stylist' };
  const unanswered = s.questions.filter((q) => q.route !== 'answer');
  const steps: ConversationStep[] = [{ key: open[profile] }];
  const gap = unanswered.find((q) => q.route === 'unanswered' && q.q);
  if (gap) steps.push({ key: 'talk.unanswered', params: { q: gap.q } });
  else if (unanswered.length) steps.push({ key: 'talk.price' });
  else if (s.questions.length) steps.push({ key: 'talk.followup', params: { q: s.questions[s.questions.length - 1]!.q } });
  else steps.push({ key: 'talk.noQuestions' });
  steps.push(concessionRow ? { key: 'talk.concede', params: { row: concessionRow } } : { key: 'talk.concede.none' });
  steps.push({ key: s.handoff.mode === 'book' ? 'talk.close.booked' : 'talk.close.offerDrive' });
  return steps;
}
