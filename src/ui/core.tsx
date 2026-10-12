import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, CircleHelp, FlaskConical, X } from 'lucide-react';
import { COPY, FACTS, type Lang } from '../data';
import { formatINR, formatNumber, formatValue } from '../domain/format';
import { parseTemplate } from '../domain/template';
import type { CalcValue } from '../domain/types';

// ---------- Language and copy ----------
const LangCtx = createContext<Lang>('en');
export const LangProvider = ({ lang, children }: { lang: Lang; children: ReactNode }) => <LangCtx.Provider value={lang}>{children}</LangCtx.Provider>;
export const useLang = () => useContext(LangCtx);

export function copyOf(lang: Lang, key: string): string {
  const s = COPY[lang][key] ?? COPY.en[key];
  if (s === undefined) {
    if (import.meta.env?.DEV) throw new Error(`Missing copy key: ${key}`);
    return key;
  }
  return s;
}
/** Plain-string copy, for aria labels and attributes. Slots are dropped. */
export function useText() {
  const lang = useLang();
  return useCallback((key: string) => parseTemplate(copyOf(lang, key)).map((x) => (x.t === 'text' ? x.v : '')).join('').trim(), [lang]);
}

export type SlotValue = ReactNode | { fact: string } | { calc: CalcValue } | { ui: number | string };
const isObj = (v: unknown, k: string): boolean => typeof v === 'object' && v !== null && k in (v as object);

/** Renders a copy template. Facts become tappable, numbers become Ui values, params are filled in. */
export function T({ k, p, ctx, plain }: { k: string; p?: Record<string, SlotValue>; ctx?: (name: string) => SlotValue; plain?: boolean }) {
  const lang = useLang();
  return <Tpl tpl={copyOf(lang, k)} p={p} ctx={ctx} plain={plain} />;
}
export function Tpl({ tpl, p, ctx, plain }: { tpl: string; p?: Record<string, SlotValue>; ctx?: (name: string) => SlotValue; plain?: boolean }) {
  const slot = (v: SlotValue, i: number): ReactNode => {
    if (isObj(v, 'fact')) return <Fact key={i} id={(v as { fact: string }).fact} plain={plain} />;
    if (isObj(v, 'calc')) return <Calc key={i} v={(v as { calc: CalcValue }).calc} plain={plain} />;
    if (isObj(v, 'ui')) return <Ui key={i}>{(v as { ui: number | string }).ui}</Ui>;
    return <span key={i}>{v as ReactNode}</span>;
  };
  return (
    <>
      {parseTemplate(tpl).map((tok, i) => {
        if (tok.t === 'text') return <span key={i}>{tok.v}</span>;
        if (tok.t === 'fact') return <Fact key={i} id={tok.id} plain={plain} />;
        if (tok.t === 'num') return <Ui key={i}>{tok.v}</Ui>;
        if (tok.t === 'ctx') return ctx ? slot(ctx(tok.name), i) : <Verify key={i} what={tok.name} />;
        const v = p?.[tok.name];
        return v === undefined || v === null ? <Verify key={i} what={tok.name} /> : slot(v, i);
      })}
    </>
  );
}

// ---------- Popover (one at a time, rendered by PopHost inside the surface) ----------
interface Pop { title: string; body: ReactNode }
const PopCtx = createContext<{ open: (p: Pop) => void; close: () => void }>({ open: () => {}, close: () => {} });
export const usePop = () => useContext(PopCtx);

// ---------- Fact registry: what the "Sources" button lists ----------
interface Registry { add: (id: string) => void; remove: (id: string) => void; ids: () => string[] }
const RegCtx = createContext<Registry | null>(null);
export const useRegistry = () => useContext(RegCtx);

export function Surface({ children, className, sheet = 'center' }: { children: ReactNode; className?: string; sheet?: 'center' | 'bottom' }) {
  const [pop, setPop] = useState<Pop | null>(null);
  const counts = useRef(new Map<string, number>());
  const registry = useMemo<Registry>(() => ({
    add: (id) => counts.current.set(id, (counts.current.get(id) ?? 0) + 1),
    remove: (id) => { const n = (counts.current.get(id) ?? 1) - 1; if (n <= 0) counts.current.delete(id); else counts.current.set(id, n); },
    ids: () => [...counts.current.keys()],
  }), []);
  const api = useMemo(() => ({ open: setPop, close: () => setPop(null) }), []);
  const t = useText();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!pop) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPop(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pop]);
  return (
    <PopCtx.Provider value={api}>
      <RegCtx.Provider value={registry}>
        <div className={className}>
          {children}
          {pop && (
            <div className={`pop-scrim pop-${sheet}`} onClick={() => setPop(null)} data-testid="pop">
              <div className="pop" role="dialog" aria-modal="true" aria-label={pop.title} onClick={(e) => e.stopPropagation()}>
                <div className="pop-head">
                  <h2>{pop.title}</h2>
                  <button ref={closeRef} className="btn btn-quiet pop-close" onClick={() => setPop(null)} aria-label={t('pop.close')}><X aria-hidden /></button>
                </div>
                <div className="pop-body">{pop.body}</div>
              </div>
            </div>
          )}
        </div>
      </RegCtx.Provider>
    </PopCtx.Provider>
  );
}

// ---------- Numbers ----------
/** A plain interface value: a counter, a unit base, the buyer's own input. No source, by design. */
export const Ui = ({ children }: { children: number | string }) => (
  <span data-ui className="num">{typeof children === 'number' ? formatNumber(children, 2) : children}</span>
);
/** Rupees the buyer chose or typed (budget bands, their own fuel price). */
export const UiMoney = ({ value }: { value: number }) => { const lang = useLang(); return <span data-ui className="num">{formatINR(value, lang)}</span>; };

function FactDetail({ id }: { id: string }) {
  const lang = useLang();
  const f = FACTS.get(id)!;
  return (
    <dl className="detail">
      <dt><T k="pop.exact" /></dt>
      <dd data-fact={id}>{f.value === null ? '—' : typeof f.value === 'number' ? `${formatNumber(f.value, 2)}${f.unit ? ` ${f.unit}` : ''}` : f.value}</dd>
      <dt><T k="pop.source" /></dt>
      <dd data-ui>{f.source}{f.doc ? ` · ${f.doc}` : ''}{f.url && <> · <a href={f.url} target="_blank" rel="noreferrer"><T k="pop.open" /></a></>}</dd>
      <dt><T k="pop.checked" /></dt>
      <dd data-ui>{f.retrieved}</dd>
      {f.asOf && (<><dt><T k="pop.asOf" /></dt><dd data-ui>{f.asOf}</dd></>)}
      <dt><T k={`pop.status.${f.status}`} /></dt>
      <dd>{f.status === 'needs-verification' ? <T k={f.value === null ? 'verify.explain' : 'verify.value'} /> : f.kind === 'proposal' ? <T k="proposed.explain" plain /> : <span>{copyOf(lang, `pop.status.${f.status}`)}</span>}</dd>
      {f.note && (<><dt><T k="pop.note" /></dt><dd data-ui>{f.note}</dd></>)}
    </dl>
  );
}

/** A value from facts.json. Tap it for its source. A missing value renders as a [Verify] chip, never a guess. */
export function Fact({ id, plain }: { id: string; plain?: boolean }) {
  const lang = useLang();
  const pop = usePop();
  const reg = useRegistry();
  useEffect(() => { reg?.add(id); return () => reg?.remove(id); }, [id, reg]);
  const f = FACTS.get(id);
  if (!f) return <Verify what={id} />;
  if (f.value === null) return <Verify what={f.label} id={id} plain={plain} />;
  const text = formatValue(f.value, f.unit, lang);
  const flag = f.status === 'needs-verification';
  const inner = (<>{text}{flag && <sup className="flag" aria-label={copyOf(lang, 'verify.chip')}>?</sup>}</>);
  if (plain) return <span className="num" data-fact={id}>{inner}</span>;
  return (
    <button type="button" className={`fact${flag ? ' fact-flag' : ''}`} data-fact={id} onClick={(e) => { e.stopPropagation(); pop.open({ title: f.label, body: <FactDetail id={id} /> }); }}>
      {inner}
    </button>
  );
}

export function calcText(v: CalcValue, lang: Lang): string {
  if (v.unit === 'INR') return formatINR(v.value, lang);
  if (v.unit === 'months') return formatNumber(Math.round(v.value));
  if (v.unit === 'km') return formatValue(Math.round(v.value / 100) * 100, 'km', lang);
  if (v.unit === '%') return `${formatNumber(v.value, 1)}%`;
  return formatValue(v.value, v.unit, lang);
}
/** A computed value. Tap it to see the formula and its inputs. */
export function Calc({ v, plain }: { v: CalcValue; plain?: boolean }) {
  const lang = useLang();
  const pop = usePop();
  const text = calcText(v, lang);
  if (plain) return <span className="num" data-calc={v.id}>{text}</span>;
  const body = (
    <dl className="detail">
      <dt><T k="pop.exact" /></dt>
      <dd data-calc={v.id}>{formatNumber(v.value, 2)} {v.unit}</dd>
      <dt><T k="pop.calc" /></dt>
      <dd><T k={`formula.${v.formula}`} /></dd>
      <dt><T k="pop.inputs" /></dt>
      <dd>
        <ul className="inputs">
          {v.inputs.map((inp, i) => 'fact' in inp
            ? <li key={i}><span>{FACTS.get(inp.fact)?.label}: </span><Fact id={inp.fact} plain /><span data-ui> · {FACTS.get(inp.fact)?.source}</span></li>
            : <li key={i}><T k={`in.${inp.label}`} />: <span data-ui className="num">{formatValue(inp.value, inp.unit, lang)}</span></li>)}
        </ul>
      </dd>
    </dl>
  );
  return <button type="button" className="fact calc" data-calc={v.id} onClick={(e) => { e.stopPropagation(); pop.open({ title: copyOf(lang, 'pop.calc'), body }); }}>{text}</button>;
}

/** A figure from the seeded simulator on the council dashboard. */
export function Sim({ value, unit, seed, plain }: { value: number; unit?: string; seed: number; plain?: boolean }) {
  const lang = useLang();
  const pop = usePop();
  const text = unit === '%' ? `${formatNumber(value, 1)}%` : formatNumber(value, unit === 'pp' ? 1 : 0);
  if (plain) return <span className="num sim" data-sim>{text}</span>;
  return (
    <button type="button" className="fact sim" data-sim onClick={() => pop.open({ title: copyOf(lang, 'pop.sim.title'), body: <p><T k="pop.sim.body" /> <T k="pop.sim.seed" />: <Ui>{String(seed)}</Ui></p> })}>
      {text}
    </button>
  );
}

export function Verify({ what, id, plain }: { what: string; id?: string; plain?: boolean }) {
  const lang = useLang();
  const pop = usePop();
  const label = copyOf(lang, 'verify.chip');
  const attrs = { 'data-verify': id ?? what };
  if (plain) return <span className="chip chip-verify" {...attrs}><CircleHelp aria-hidden />{label}</span>;
  return (
    <button type="button" className="chip chip-verify" {...attrs} onClick={(e) => { e.stopPropagation(); pop.open({ title: copyOf(lang, 'verify.title'), body: <><p><T k="verify.explain" /></p><p><strong><T k="verify.needed" />:</strong> <span data-ui>{what}</span></p></> }); }}>
      <CircleHelp aria-hidden />{label}
    </button>
  );
}

export function Proposed({ plain }: { plain?: boolean }) {
  const lang = useLang();
  const pop = usePop();
  if (plain) return <span className="chip chip-proposed" data-proposed><FlaskConical aria-hidden /><T k="proposed.chip" /></span>;
  return (
    <button type="button" className="chip chip-proposed" data-proposed onClick={(e) => { e.stopPropagation(); pop.open({ title: copyOf(lang, 'proposed.title'), body: <p><T k="proposed.explain" /></p> }); }}>
      <FlaskConical aria-hidden /><T k="proposed.chip" />
    </button>
  );
}

export function SourcesButton({ className }: { className?: string }) {
  const lang = useLang();
  const pop = usePop();
  const reg = useRegistry();
  const open = () => {
    const ids = (reg?.ids() ?? []).filter((id) => FACTS.has(id));
    pop.open({
      title: copyOf(lang, 'sources.title'),
      body: ids.length === 0 ? <p><T k="sources.empty" /></p> : (
        <ul className="sources">
          {ids.map((id) => { const f = FACTS.get(id)!; return (
            <li key={id}>
              <strong>{f.label}</strong>
              <span>{f.value === null ? <Verify what={f.label} id={id} plain /> : <Fact id={id} plain />}</span>
              <span data-ui className="src">{f.source} · {f.retrieved}</span>
            </li>
          ); })}
        </ul>
      ),
    });
  };
  return <button type="button" className={className ?? 'btn btn-quiet'} onClick={open} data-testid="sources"><T k="nav.sources" /></button>;
}

export const Better = () => { const t = useText(); return <span className="better" role="img" aria-label={t('cmp.better')}><Check aria-hidden /></span>; };

export function Footer() {
  return <footer className="disclaimer"><T k="footer" plain /></footer>;
}

// ---------- Fixed canvas ----------
/** A fixed-size stage scaled to fit its container, letterboxed. Pointer events map through the CSS transform. */
export function FixedStage({ width, height, children, className }: { width: number; height: number; children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = outer.current!;
    const fit = () => setScale(Math.min(el.clientWidth / width, el.clientHeight / height));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);
  return (
    <div ref={outer} className={`stage-outer ${className ?? ''}`}>
      <div className="stage-box" style={{ width: width * scale, height: height * scale }}>
        <div className="stage" style={{ width, height, transform: `scale(${scale})` }} data-scale={scale.toFixed(4)}>{children}</div>
      </div>
    </div>
  );
}

// ---------- Car image placeholder ----------
const SHAPES: Record<string, string> = {
  compact: 'M6 62 C6 50 12 46 26 44 L52 26 C58 20 66 18 78 18 L128 18 C142 18 152 22 162 32 L176 44 C190 46 196 52 196 62 L196 70 L178 70 A16 16 0 0 0 146 70 L64 70 A16 16 0 0 0 32 70 L6 70 Z',
  midsize: 'M4 62 C4 48 10 44 24 42 L46 22 C52 16 60 14 74 14 L138 14 C152 14 162 18 170 28 L182 42 C194 44 198 50 198 62 L198 70 L180 70 A17 17 0 0 0 146 70 L62 70 A17 17 0 0 0 28 70 L4 70 Z',
  offroader: 'M8 64 L8 40 L40 38 L50 14 L168 14 L174 40 L190 42 L190 64 L190 70 L176 70 A17 17 0 0 0 142 70 L66 70 A17 17 0 0 0 32 70 L8 70 Z',
};
export function ImageSlot({ id, shape, name, className }: { id: string; shape: string; name: string; className?: string }) {
  // The list of supplied images is fixed at build time (vite.config.ts), so nothing is probed over the network.
  const [hasFile, setHasFile] = useState(__CAR_IMAGES__.includes(id));
  const src = `/cars/${id}.webp`;
  return (
    <figure className={`imgslot ${className ?? ''}`} data-slot={id}>
      {hasFile && <img src={src} alt={name} onError={() => setHasFile(false)} />}
      {!hasFile && (
        <svg viewBox="0 0 202 92" role="img" aria-label={name}>
          <path d={SHAPES[shape] ?? SHAPES.midsize} className="sil" />
          <circle cx={shape === 'offroader' ? 49 : 46} cy="70" r="13" className="wheel" />
          <circle cx={shape === 'offroader' ? 159 : 163} cy="70" r="13" className="wheel" />
          <line x1="0" y1="84" x2="202" y2="84" className="ground" />
        </svg>
      )}
      {!hasFile && <figcaption><T k="img.needed" />: {name}</figcaption>}
    </figure>
  );
}
