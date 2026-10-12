import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FACT_LIST, num } from '../data';
import type { CalcValue } from '../domain/types';
import { Fact, Footer, LangProvider, Surface, T, Ui, Verify } from '../ui/core';
import '../ui/rest.css';

export default function About() {
  const [onlyGaps, setOnlyGaps] = useState(false);
  const count = (s: string) => FACT_LIST.filter((f) => f.status === s).length;
  const econ: CalcValue = {
    id: 'econ.total.calc',
    value: (num('roll.nexa.outlets')! + num('roll.arena.outlets')!) * num('econ.run')! + num('prog.content.cost')!,
    unit: 'INR', formula: 'econ',
    inputs: [{ fact: 'roll.nexa.outlets' }, { fact: 'roll.arena.outlets' }, { fact: 'econ.run' }, { fact: 'prog.content.cost' }],
  };
  const sec = (h: string, keys: string[], p?: Record<string, React.ReactNode | { calc: CalcValue } | { ui: number }>) => (
    <section>
      <h2><T k={h} /></h2>
      {keys.map((k) => <p key={k}><T k={k} p={p} /></p>)}
    </section>
  );
  const facts = onlyGaps ? FACT_LIST.filter((f) => f.status === 'needs-verification') : FACT_LIST;
  return (
    <LangProvider lang="en">
      <Surface className="about">
        <header><Link to="/demo" className="btn btn-quiet"><T k="x.ab.back" /></Link><h1><T k="x.ab.title" /></h1></header>
        <main>
          {sec('x.ab.what.h', ['x.ab.what'])}
          {sec('x.ab.honest.h', ['x.ab.honest'])}
          {sec('x.ab.data.h', ['x.ab.data'], { total: { ui: FACT_LIST.length }, verified: { ui: count('verified') }, team: { ui: count('from-team-research') }, gaps: { ui: count('needs-verification') } })}
          {sec('x.ab.engine.h', ['x.ab.engine', 'x.ab.engine.c1', 'x.ab.engine.c2', 'x.ab.engine.c3', 'x.ab.engine.c4', 'x.ab.engine.c5', 'x.ab.engine.rival'])}
          {sec('x.ab.variants.h', ['x.ab.variants', 'x.ab.skill'])}
          {sec('x.ab.prior.h', ['x.ab.prior'])}
          {sec('x.ab.econ.h', ['x.ab.econ.1', 'x.ab.econ.2', 'x.ab.econ.3', 'x.ab.econ.4'], { calc: { calc: econ } })}
          {sec('x.ab.roll.h', ['x.ab.roll.1', 'x.ab.roll.2', 'x.ab.roll.3', 'x.ab.roll.4'])}
          {sec('x.ab.price.h', ['x.ab.price'])}
          {sec('x.ab.privacy.h', ['x.ab.privacy', 'x.ab.privacy.anon'])}
          {sec('x.ab.limits.h', ['x.ab.limits.1', 'x.ab.limits.2', 'x.ab.limits.3', 'x.ab.limits.4', 'x.ab.limits.5', 'x.ab.limits.6'])}
          <section>
            <h2><T k="x.ab.sources.h" /></h2>
            <label className="tick"><input type="checkbox" checked={onlyGaps} onChange={() => setOnlyGaps(!onlyGaps)} data-testid="only-gaps" /><span><T k="x.ab.sources.filter" /></span></label>
            <p className="note"><Ui>{facts.length}</Ui></p>
            <div className="tablewrap" tabIndex={0}>
              <table className="facts">
                <thead><tr><th scope="col"><T k="x.ab.facts.id" /></th><th scope="col"><T k="x.ab.facts.value" /></th><th scope="col"><T k="x.ab.facts.source" /></th><th scope="col"><T k="x.ab.facts.status" /></th></tr></thead>
                <tbody>
                  {facts.map((f) => (
                    <tr key={f.id}>
                      <th scope="row">{f.label}<br /><code data-ui>{f.id}</code></th>
                      <td>{f.value === null ? <Verify what={f.label} id={f.id} /> : <Fact id={f.id} />}</td>
                      <td data-ui>{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.source}</a> : `${f.source} · ${f.doc}`} · {f.retrieved}</td>
                      <td><T k={`pop.status.${f.status}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
        <Footer />
      </Surface>
    </LangProvider>
  );
}
