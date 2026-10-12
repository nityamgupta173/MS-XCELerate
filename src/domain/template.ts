/**
 * Copy templates. Three kinds of slot:
 *   {f:fact.id}   a fact from facts.json, rendered with its source popover
 *   {n:1000}      a plain interface number (a unit base such as "per 1,000 km")
 *   {c:name}      a value worked out from the current session (the buyer's pick, their distance, ...)
 *   {name}        a parameter supplied by the caller
 */
export type Token =
  | { t: 'text'; v: string }
  | { t: 'fact'; id: string }
  | { t: 'num'; v: number }
  | { t: 'ctx'; name: string }
  | { t: 'param'; name: string };

const SLOT = /\{(?:(f|n|c):([^}]+)|([A-Za-z][A-Za-z0-9_]*))\}/g;

export function parseTemplate(tpl: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of tpl.matchAll(SLOT)) {
    if (m.index > last) out.push({ t: 'text', v: tpl.slice(last, m.index) });
    if (m[1] === 'f') out.push({ t: 'fact', id: m[2]! });
    else if (m[1] === 'n') out.push({ t: 'num', v: Number(m[2]) });
    else if (m[1] === 'c') out.push({ t: 'ctx', name: m[2]! });
    else out.push({ t: 'param', name: m[3]! });
    last = m.index + m[0].length;
  }
  if (last < tpl.length) out.push({ t: 'text', v: tpl.slice(last) });
  return out;
}

/** Text outside slots. Used by the number lint: this must contain no digits. */
export const literalText = (tpl: string): string => parseTemplate(tpl).filter((x) => x.t === 'text').map((x) => (x as { v: string }).v).join('');
export const factIdsIn = (tpl: string): string[] => parseTemplate(tpl).flatMap((x) => (x.t === 'fact' ? [x.id] : []));

/** Copy keys for staff and judge surfaces, which are English-only by design. */
export const STAFF_PREFIXES = ['x.', 'talk.', 'profile.', 'gap.'];
