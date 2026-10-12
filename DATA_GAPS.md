# Data gaps

What could not be confirmed, where sources disagree, and what the prototype does about it. The table at the bottom is generated from `src/data/facts.json`; the notes above it are written by hand.

Retrieved 12 Oct 2026. Prices are ex-showroom, New Delhi, from CarDekho price pages that state "Prices updated October 2026". Manufacturer sites were not read directly in this pass: that is the first thing to redo before the deck is submitted.

## Things the team should know before presenting

1. **The Brezza now has a 5-star Bharat NCAP rating** (2026 facelift, tested June 2026, adult 30.41 / 32). The brief's framing that "Tata owns safe" in compacts is still true of owner perception (57% vs 17% of reviews), but on published tests the Nexon and Brezza are now level. The kiosk says exactly that.
2. **The Grand Vitara has no published Bharat NCAP rating.** Leaked crash-test images were reported in late 2025 and early 2026 with unofficial talk of four stars. Nothing official was found. The kiosk shows "No Bharat NCAP rating published" and will not borrow the Victoris rating.
3. **The Seltos on sale is the new generation, with five stars** (Bharat NCAP, March 2026). On safety the kiosk therefore tells an Arrived Upgrader that the Seltos is ahead of the Grand Vitara. That is the honest result and it is a real weakness in the Grand Vitara story.
4. **The Grand Vitara top hybrid is now cheaper than the Hyryder top hybrid** (₹19.62 lakh against ₹19.99 lakh). The same-car panel can make that point; the deck's "identical car" slide should use these figures.
5. **Petrol at ₹102.12 a litre is confirmed** by five consecutive published daily tables (1 to 9 Oct 2026). An IOCL-published notice was not found, so the source is a newspaper table, not IOCL itself.

## Verified absent, and shown as such

- Bharat NCAP ratings for the Grand Vitara, Hyryder, Creta, Fronx and Jimny: not in Autocar India's list of every car tested as of 16 Sep 2026.

## Left out because no source was found

| Item | Effect in the prototype |
|---|---|
| e Vitara energy consumption (kWh per 100 km) | The electric is excluded from running-cost comparisons, with a visible Verify chip. No electricity tariff assumption was needed. |
| Feature lists per variant | "Design and features" is scored by a declared proxy (position in the model's price walk) and flagged on the Match screen. |
| Rival buyback and repeat-repair programmes | The rival side of those rows shows a Verify chip, not "none". |
| Boot capacity: Grand Vitara and Hyryder hybrids, Victoris, Brezza, e Vitara | Verify chip. The honest read counts these as missing rows. |
| Ground clearance: Hyryder, Brezza, e Vitara | Verify chip. |
| Hyryder petrol, CNG and AWD power, torque and claimed efficiency | Verify chip. Only the hybrid is fully specified. |
| Hyryder hybrid battery warranty; Seltos standard warranty | Verify chip. |
| ADAS availability on most individual variants | Verify chip. Where a source lists none, the kiosk shows "None listed" with a verify flag. |
| Fronx standard airbag count (sources say two and six) | Verify chip. |
| Victoris manufacturing plant; plants for all models except the Bidadi twins | The "Built at" row appears only for the twins. |
| Invicto seating layouts | Verify chip in the seven-seat suggestion. |
| e Vitara charging speed (sources say 70 kW and 150 kW) | The question is routed to the product expert. |
| Fronx or Brezza design editions | Not shown at all. |
| Whether the CNG Grand Vitara and AWD Grand Vitara are still sold | **Confirmed sold**: both appear on the October 2026 price page (Delta CNG, Zeta CNG; Alpha AWD AT). The earlier "1.5 CNG" concern is resolved. |

## Conflicts between sources

| Fact | Sources | Used |
|---|---|---|
| Grand Vitara petrol torque | 136.8 to 139 Nm across pages | 137 Nm (Autocar India) |
| Strong-hybrid power | 114 bhp, 116 PS, 116 hp | 114 bhp, the unit CarDekho prints |
| Seltos boot | 433 l and 447 l, both on Autocar India | 447 l, flagged |
| Seltos claimed efficiency | Autocar India lists figures but says they are "yet to be officially confirmed" | Autocar India's figures, flagged |
| Victoris boot | 373 l and about 439 l | None; Verify chip |
| Jimny boot | 208, 211 and 219 l | 208 l, flagged |
| e Vitara 49 kWh range | 440 km (CarDekho) and 344 km WLTP (another site) | 440 km, the figure on the price page |
| Fronx turbo automatic efficiency | 20.01 and 20.1 km/l | 20.01 km/l, flagged |
| CNG price, Delhi | 86.98 (three reports) and 83.09 (one Hindi report) | ₹86.98 per kg |
| Creta King iVT price | ₹18.69 lakh in the brief, ₹18,68,800 on the price page | ₹18,68,800 |

## Arithmetic differences from the brief

- Monthly fuel, Grand Vitara hybrid at 1,500 km: the brief prints ₹5,476; unrounded inputs give ₹5,476.58, shown as **₹5,477**.
- Grand Vitara over Creta price gap: the brief uses ₹93,000 (both prices rounded to lakh); the exact gap is **₹93,200**. The break-even moves from about 43,900 km to about 44,000 km.

<!-- generated:facts -->

## Every fact marked `needs-verification`

Generated by `npm run data:docs`.

| Fact id | What | Value shown | Why it is flagged |
|---|---|---|---|
| `msil.warranty.range` | Maruti Suzuki standard warranty (other models) | 3 years / 1,00,000 km | Autocar India, Grand Vitara model page (applied to other Maruti Suzuki models) |
| `rival.buyback` | Rival standard buyback programme | (none) | DATA_GAPS.md: whether each rival brand publishes a comparable assured-buyback programme |
| `rival.repeatrepair` | Rival repeat-repair loaner cover | (none) | DATA_GAPS.md: whether each rival brand publishes a comparable repeat-repair loaner commitment |
| `hybrid.range` | Strong hybrid claimed range per tank (more than) | 1,000 km | The brief asks for re-verification. Tank 45 L x 27.97 km/l claimed = about 1,259 km, consistent with the claim. |
| `hy.sh.battery.warranty` | Hyryder strong-hybrid battery warranty | (none) | DATA_GAPS.md: Toyota hybrid battery warranty terms, from toyotabharat.com |
| `mpv.invicto.seats` | Invicto seating | (none) | DATA_GAPS.md: Invicto seating layouts, from nexaexperience.com |
| `gv.boot.sh` | Grand Vitara strong hybrid, boot | (none) | DATA_GAPS.md: Grand Vitara strong-hybrid boot capacity (the battery reduces it) |
| `gv.sigma.adas` | gv Sigma, driver assistance | None listed | CarDekho, Grand Vitara specifications (page states "Prices updated October 2026") |
| `gv.delta-at.adas` | gv Delta AT, driver assistance | None listed | CarDekho, Grand Vitara specifications (page states "Prices updated October 2026") |
| `gv.delta-cng.adas` | gv Delta CNG, driver assistance | None listed | CarDekho, Grand Vitara specifications (page states "Prices updated October 2026") |
| `gv.alpha-awd.adas` | gv Alpha AWD AT, driver assistance | None listed | CarDekho, Grand Vitara specifications (page states "Prices updated October 2026") |
| `gv.deltaplus-sh.adas` | gv Delta Plus Strong Hybrid, driver assistance | None listed | CarDekho, Grand Vitara specifications (page states "Prices updated October 2026") |
| `gv.alphaplus-sh.adas` | gv Alpha Plus (O) Strong Hybrid, driver assistance | None listed | CarDekho, Grand Vitara specifications (page states "Prices updated October 2026") |
| `vic.built` | Victoris, built at | (none) | DATA_GAPS.md: Victoris manufacturing plant |
| `vic.boot` | Victoris, boot | (none) | DATA_GAPS.md: Victoris boot capacity: sources give 373 l and about 439 l |
| `vic.gc` | Victoris, ground clearance (unladen) | 210 mm | Bajaj Finserv, Victoris ground clearance, 18 Sep 2025 |
| `vic.lxi.adas` | vic LXI, driver assistance | Not on this variant | DATA_GAPS.md: Victoris: which variants carry Level 2 ADAS |
| `vic.vxi-at.adas` | vic VXI AT, driver assistance | Not on this variant | DATA_GAPS.md: Victoris: which variants carry Level 2 ADAS |
| `vic.vxi-cng.adas` | vic VXI CNG, driver assistance | Not on this variant | DATA_GAPS.md: Victoris: which variants carry Level 2 ADAS |
| `vic.vxi-sh.adas` | vic VXI Strong Hybrid, driver assistance | Not on this variant | DATA_GAPS.md: Victoris: which variants carry Level 2 ADAS |
| `brz.boot` | Brezza, boot | (none) | DATA_GAPS.md: 2026 Brezza boot capacity |
| `brz.gc` | Brezza, ground clearance | (none) | DATA_GAPS.md: 2026 Brezza ground clearance |
| `brz.lxi-turbo.adas` | brz LXi Turbo, driver assistance | (none) | DATA_GAPS.md: brz LXi Turbo: ADAS availability on this variant |
| `brz.vxi.adas` | brz VXi, driver assistance | (none) | DATA_GAPS.md: brz VXi: ADAS availability on this variant |
| `brz.lxi-cng.adas` | brz LXi CNG, driver assistance | (none) | DATA_GAPS.md: brz LXi CNG: ADAS availability on this variant |
| `brz.vxi-at.adas` | brz VXi AT, driver assistance | (none) | DATA_GAPS.md: brz VXi AT: ADAS availability on this variant |
| `brz.zxiplus-at.adas` | brz ZXi Plus AT, driver assistance | (none) | DATA_GAPS.md: brz ZXi Plus AT: ADAS availability on this variant |
| `frx.airbags` | Fronx, airbags (standard) | (none) | DATA_GAPS.md: Fronx standard airbag count: sources give two and six |
| `frx.sigma.adas` | frx Sigma, driver assistance | (none) | DATA_GAPS.md: frx Sigma: ADAS availability on this variant |
| `frx.deltaplus-amt.adas` | frx Delta Plus AMT, driver assistance | (none) | DATA_GAPS.md: frx Delta Plus AMT: ADAS availability on this variant |
| `frx.delta-cng.adas` | frx Delta CNG, driver assistance | (none) | DATA_GAPS.md: frx Delta CNG: ADAS availability on this variant |
| `frx.alpha-turbo-at.eff` | frx Alpha Turbo AT, claimed efficiency | 20.01 km/l | Business Standard, Fronx prices and claimed mileage |
| `frx.alpha-turbo-at.adas` | frx Alpha Turbo AT, driver assistance | (none) | DATA_GAPS.md: frx Alpha Turbo AT: ADAS availability on this variant |
| `ev.airbags` | e Vitara, airbags | 7 airbags | MeraEV, e Vitara listing |
| `ev.boot` | e Vitara, boot | (none) | DATA_GAPS.md: e Vitara boot capacity |
| `ev.gc` | e Vitara, ground clearance | (none) | DATA_GAPS.md: e Vitara ground clearance |
| `ev.zeta.power` | ev Zeta, maximum power | 174 PS | Times Drive, e Vitara detailed price list and variants |
| `ev.alpha.power` | ev Alpha, maximum power | 174 PS | Times Drive, e Vitara detailed price list and variants |
| `ev.consumption` | e Vitara energy consumption | (none) | DATA_GAPS.md: a published e Vitara consumption figure; without it the EV is left out of cost comparisons |
| `jim.boot` | Jimny, boot | 208 litres | Sources give 208, 211 and 219 litres. |
| `jim.zeta.adas` | jim Zeta, driver assistance | (none) | DATA_GAPS.md: jim Zeta: ADAS availability on this variant |
| `jim.alpha-at.adas` | jim Alpha AT, driver assistance | (none) | DATA_GAPS.md: jim Alpha AT: ADAS availability on this variant |
| `hy.boot` | Hyryder, boot | (none) | DATA_GAPS.md: Hyryder boot capacity: the specification page shows 273 l and a reported 373 l |
| `hy.gc` | Hyryder, ground clearance | (none) | DATA_GAPS.md: Hyryder ground clearance |
| `hy.e.power` | hy E, maximum power | (none) | DATA_GAPS.md: hy E: power |
| `hy.e.torque` | hy E, maximum torque | (none) | DATA_GAPS.md: hy E: torque |
| `hy.e.eff` | hy E, claimed efficiency | (none) | DATA_GAPS.md: hy E: claimed efficiency |
| `hy.e.adas` | hy E, driver assistance | (none) | DATA_GAPS.md: hy E: ADAS availability on this variant |
| `hy.s-at.power` | hy S AT, maximum power | (none) | DATA_GAPS.md: hy S AT: power |
| `hy.s-at.torque` | hy S AT, maximum torque | (none) | DATA_GAPS.md: hy S AT: torque |
| `hy.s-at.eff` | hy S AT, claimed efficiency | (none) | DATA_GAPS.md: hy S AT: claimed efficiency |
| `hy.s-at.adas` | hy S AT, driver assistance | (none) | DATA_GAPS.md: hy S AT: ADAS availability on this variant |
| `hy.s-cng.power` | hy S CNG, maximum power | (none) | DATA_GAPS.md: hy S CNG: power |
| `hy.s-cng.torque` | hy S CNG, maximum torque | (none) | DATA_GAPS.md: hy S CNG: torque |
| `hy.s-cng.eff` | hy S CNG, claimed efficiency | (none) | DATA_GAPS.md: hy S CNG: claimed efficiency |
| `hy.s-cng.adas` | hy S CNG, driver assistance | (none) | DATA_GAPS.md: hy S CNG: ADAS availability on this variant |
| `hy.v-awd.power` | hy V AWD AT, maximum power | (none) | DATA_GAPS.md: hy V AWD AT: power |
| `hy.v-awd.torque` | hy V AWD AT, maximum torque | (none) | DATA_GAPS.md: hy V AWD AT: torque |
| `hy.v-awd.eff` | hy V AWD AT, claimed efficiency | (none) | DATA_GAPS.md: hy V AWD AT: claimed efficiency |
| `hy.v-awd.adas` | hy V AWD AT, driver assistance | (none) | DATA_GAPS.md: hy V AWD AT: ADAS availability on this variant |
| `hy.s-sh.adas` | hy S Hybrid, driver assistance | (none) | DATA_GAPS.md: hy S Hybrid: ADAS availability on this variant |
| `hy.v-sh.adas` | hy V Hybrid, driver assistance | (none) | DATA_GAPS.md: hy V Hybrid: ADAS availability on this variant |
| `cr.e.eff` | cr E, claimed efficiency | 17.4 km/l | CarDekho, Creta specifications (page states "Prices updated October 2026") |
| `cr.e.adas` | cr E, driver assistance | (none) | DATA_GAPS.md: cr E: ADAS availability on this variant |
| `cr.exo-ivt.adas` | cr EX (O) iVT, driver assistance | (none) | DATA_GAPS.md: cr EX (O) iVT: ADAS availability on this variant |
| `cr.king-turbo.eff` | cr King Turbo DCT, claimed efficiency | (none) | DATA_GAPS.md: cr King Turbo DCT: claimed efficiency |
| `sel.boot` | Seltos, boot | 447 litres | CarDekho lists 447 l; Autocar India gives 433 l in one place and 447 l in another. |
| `sel.warranty` | Seltos standard warranty | (none) | DATA_GAPS.md: Kia Seltos standard warranty terms, from kia.com/in |
| `sel.hte.torque` | sel HTE, maximum torque | (none) | DATA_GAPS.md: sel HTE: torque |
| `sel.hte.eff` | sel HTE, claimed efficiency | 16.5 km/l | Autocar India, new Seltos model page, updated 12 Oct 2026 |
| `sel.hte.adas` | sel HTE, driver assistance | (none) | DATA_GAPS.md: sel HTE: ADAS availability on this variant |
| `sel.htk-ivt.torque` | sel HTK iVT, maximum torque | (none) | DATA_GAPS.md: sel HTK iVT: torque |
| `sel.htk-ivt.eff` | sel HTK iVT, claimed efficiency | 16.5 km/l | Autocar India, new Seltos model page, updated 12 Oct 2026 |
| `sel.htk-ivt.adas` | sel HTK iVT, driver assistance | (none) | DATA_GAPS.md: sel HTK iVT: ADAS availability on this variant |
| `sel.gtx-ivt.torque` | sel GTX iVT, maximum torque | (none) | DATA_GAPS.md: sel GTX iVT: torque |
| `sel.gtx-ivt.eff` | sel GTX iVT, claimed efficiency | 16.5 km/l | Autocar India, new Seltos model page, updated 12 Oct 2026 |
| `sel.gtx-ivt.adas` | sel GTX iVT, driver assistance | Level 2 | Autocar India, new Seltos model page, updated 12 Oct 2026 |
| `sel.gtxa-turbo.eff` | sel GTX (A) Turbo DCT, claimed efficiency | 17.5 km/l | Autocar India, new Seltos model page, updated 12 Oct 2026 |
| `sel.gtxa-turbo.adas` | sel GTX (A) Turbo DCT, driver assistance | Level 2 | Autocar India, new Seltos model page, updated 12 Oct 2026 |
| `sel.gtx-d-at.eff` | sel GTX Diesel AT, claimed efficiency | 17.8 km/l | Autocar India, new Seltos model page, updated 12 Oct 2026 |
| `sel.gtx-d-at.adas` | sel GTX Diesel AT, driver assistance | Level 2 | Autocar India, new Seltos model page, updated 12 Oct 2026 |
| `nx.smart.adas` | nx Smart, driver assistance | (none) | DATA_GAPS.md: nx Smart: ADAS availability on this variant |
| `nx.pureplus-amt.adas` | nx Pure Plus AMT, driver assistance | (none) | DATA_GAPS.md: nx Pure Plus AMT: ADAS availability on this variant |
| `nx.smartplus-cng.adas` | nx Smart Plus CNG, driver assistance | (none) | DATA_GAPS.md: nx Smart Plus CNG: ADAS availability on this variant |
| `nx.creative-dca.adas` | nx Creative DCA, driver assistance | (none) | DATA_GAPS.md: nx Creative DCA: ADAS availability on this variant |
