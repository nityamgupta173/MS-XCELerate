import { useEffect, useMemo, useState } from 'react';
import { Languages, MapPin, MessageCircle, Trash2 } from 'lucide-react';
import { lookup, num, type Lang } from '../data';
import { buildRows, isTwinPair } from '../domain/compare';
import { decodePayload } from '../domain/payload';
import type { AskedQuestion, FuelPrices } from '../domain/types';
import { patchSession } from '../state/bus';
import { Fact, Footer, LangProvider, Proposed, Surface, T, Ui, copyOf } from '../ui/core';
import { Answer, HonestRead, PayBackLine, PromiseBody, RowView, Stepper, TwinPanel, costModel } from './kiosk/screensB';
import { Calc, Verify } from '../ui/core';
import '../ui/rest.css';

const deletedKey = (id: string) => `hg.m.deleted.${id}`;

export default function Phone() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const decoded = useMemo(() => decodePayload(hash), [hash]);
  const [lang, setLang] = useState<Lang>(decoded.ok ? decoded.payload.l : 'en');
  const id = decoded.ok ? decoded.payload.i : '';
  const [deleted, setDeleted] = useState(() => { try { return Boolean(id && localStorage.getItem(deletedKey(id))); } catch { return false; } });
  const [booked, setBooked] = useState(false);
  const [km, setKm] = useState(decoded.ok ? decoded.payload.km : 1150);
  const [years, setYears] = useState(decoded.ok ? decoded.payload.y : 5);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const shell = (body: React.ReactNode) => (
    <LangProvider lang={lang}>
      <Surface className={`phone${lang === 'hi' ? ' is-hi' : ''}`}>
        <header className="phone-head">
          <strong><T k="brand.title" /></strong>
          <button type="button" className="btn btn-quiet" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} lang={lang === 'en' ? 'hi' : 'en'} data-testid="m-lang"><Languages aria-hidden /><T k={lang === 'en' ? 'lang.hi' : 'lang.en'} /></button>
        </header>
        <main>{body}</main>
        <Footer />
      </Surface>
    </LangProvider>
  );

  if (!decoded.ok) return shell(<section data-testid="m-error"><h1><T k="m.error.title" /></h1><p><T k="m.error.body" /></p></section>);
  if (deleted) return shell(<section data-testid="m-deleted"><h1><T k="m.privacy" /></h1><p className="notice"><T k="m.deleted" /></p></section>);

  const p = decoded.payload;
  const pick = p.p ? lookup(p.p) : undefined;
  const target = p.r ? lookup(p.r) : undefined;
  const prices: FuelPrices = { petrol: num('fuel.petrol.delhi')!, cng: num('fuel.cng.delhi')!, diesel: num('fuel.diesel.delhi')! };
  const rows = pick && target ? buildRows(pick.variant.id, target.variant.id, prices) : [];
  const questions: AskedQuestion[] = p.q.map((q) => ({ q: q.q, intent: q.i, route: q.i ? 'answer' : 'unanswered', lang: p.l, at: 0 }));
  const cost = pick ? costModel(pick, target ?? null, prices, km, years, 'claimed') : null;
  const k = { pick: pick ?? null, target: target ? { ...target, rule: 'chosen' as const, sibling: false } : null, prices };

  const remove = () => {
    try { localStorage.setItem(deletedKey(p.i), '1'); } catch { /* storage unavailable */ }
    patchSession(p.i, (r) => ({ ...r, questions: [], handoff: { ...r.handoff, consent: false, phone: null }, lead: { ...r.lead, deleted: true } }));
    setDeleted(true);
  };
  const book = () => {
    patchSession(p.i, (r) => ({ ...r, updatedAt: Date.now(), handoff: { ...r.handoff, mode: 'book', slot: r.handoff.slot ?? 'sat1', at: r.handoff.at ?? Date.now() } }));
    setBooked(true);
  };

  return shell(
    <>
      <section>
        <h1><T k="m.title" /></h1>
        <p className="note"><T k="m.intro" /></p>
      </section>
      {!pick && <section><p className="notice"><T k="m.nopick" /></p></section>}
      {pick && (
        <section data-testid="m-pick">
          <span className="eyebrow"><T k="m.pick" /></span>
          <h2>{pick.model.name} <span className="sub">{pick.variant.name}</span></h2>
          <p className="price"><Fact id={pick.variant.facts.price} /> · <T k="match.at" p={{ channel: copyOf(lang, `ch.${pick.model.channel ?? 'nexa'}`) }} /></p>
        </section>
      )}
      {pick && target && (
        <section data-testid="m-compare">
          <table className="cmp">
            <thead><tr><td /><th scope="col">{pick.model.name}<br /><span className="sub">{pick.variant.name}</span></th><th scope="col">{target.model.name}<br /><span className="sub">{target.variant.name}</span></th></tr></thead>
            <tbody>{rows.map((r) => <RowView key={r.key} r={r} />)}</tbody>
          </table>
          <HonestRead rows={rows} ours={pick.model.name} theirs={target.model.name} />
          {isTwinPair(pick.variant.id, target.variant.id) && <TwinPanel />}
        </section>
      )}
      <section data-testid="m-questions">
        <h2><T k="m.questions" /></h2>
        {questions.length === 0 && <p className="note"><T k="m.noquestions" /></p>}
        {questions.map((q, i) => (<div key={i} className="qa"><p className="asked" data-ui>{q.q}</p><Answer q={q} k={k} km={km} years={years} /></div>))}
      </section>
      {pick && cost && (
        <section data-testid="m-costs">
          <h2><T k="m.costs" /></h2>
          <div className="steppers">
            <Stepper label={<T k="cost.km" />} value={<><Ui>{km}</Ui> <T k="cost.km.unit" /></>} onDec={() => setKm(Math.max(km - 100, 100))} onInc={() => setKm(Math.min(km + 100, 6000))} />
            <Stepper label={<T k="cost.years" />} value={<Ui>{years}</Ui>} onDec={() => setYears(Math.max(years - 1, 1))} onInc={() => setYears(Math.min(years + 1, 7))} />
          </div>
          <p><T k="cost.monthly" />: <strong>{pick.model.name}</strong> {cost.a ? <Calc v={cost.a.monthly} /> : <Verify what="efficiency or consumption" />}{target && <> · <strong>{target.model.name}</strong> {cost.b ? <Calc v={cost.b.monthly} /> : <Verify what="efficiency" />}</>}</p>
          {cost.pb && <PayBackLine pb={cost.pb} names={cost.names} />}
          <p className="fine"><T k="cost.excluded" /></p>
        </section>
      )}
      <section data-testid="m-promises">
        <h2><T k="m.promises" /></h2>
        {(['promise', 'pledge', 'weekend'] as const).map((tab) => (<div key={tab} className="promise-block"><h3><T k={`prom.tab.${tab}`} /></h3><PromiseBody tab={tab} /></div>))}
      </section>
      <section className="actions">
        {!booked && <button type="button" className="btn btn-primary" onClick={book} data-testid="m-book"><T k="m.book" /></button>}
        {booked && <p className="notice" data-testid="m-booked"><T k="m.book.done" /> <Proposed /></p>}
        <button type="button" className="btn" disabled aria-describedby="wa-note"><MessageCircle aria-hidden /><T k="m.whatsapp" /></button>
        <p className="fine" id="wa-note"><T k="m.whatsapp.note" /></p>
        <p className="outlet"><MapPin aria-hidden /><span><T k="m.find" />: <T k="m.find.note" /></span></p>
      </section>
      <section data-testid="m-privacy">
        <h2><T k="m.privacy" /></h2>
        <p><T k="m.privacy.stored" /></p>
        <p><T k="m.privacy.consent" /></p>
        <button type="button" className="btn" onClick={remove} data-testid="m-delete"><Trash2 aria-hidden /><T k="m.delete" /></button>
      </section>
    </>,
  );
}
