# NEXA Discovery Kiosk: concept prototype

Concept prototype for **Maruti Suzuki XCELerate 2026, B-Track** ("Rebuilding Aspiration in the SUV Portfolio"). It shows how the Higher Ground organisation would work on the showroom floor. The kiosk:

- gives an honest comparison and says where the rival wins;
- sends buyers to the Arena Victoris when it fits them better, with both showrooms credited;
- hands a consented summary to the product expert.

The technology supports the organisation design; it is not the point of it.

Not an official Maruti Suzuki product or screen.

## Screens

| Page | What it is |
|---|---|
| `index.html` | Landing page linking the three screens |
| `kiosk.html` | 43-inch portrait touch kiosk (1080×1920), scaled to fit the window |
| `phone.html` | What arrives on the buyer's phone after "Send to my phone" |
| `tablet.html` | The product expert's tablet: consented summary, suggested conversation, masked number until booking |

### Kiosk flow

1. **Attract.**
2. **Shortlist:** Hyryder, Creta, Seltos, Victoris or not sure.
3. **Three needs:** monthly distance, top priority, riders.
4. **Match.** The match changes with the answers:
   - safety leads to the Victoris at Arena;
   - performance leads to "a turbo petrol may suit you better";
   - seven seats leads to "none of these seats seven".
5. **Explore:**
   - like-for-like comparison, with entry and top variants where both exist, and "the honest read";
   - running-cost calculator;
   - 12 sourced questions;
   - the promises.
6. **Hand-off:** consent, Weekend Ownership slot, Arena referral, QR.
7. **Done.**

The kiosk clears itself after 60 seconds untouched.

### Light and dark mode

Every screen has a Light / Dark switch in its header (the kiosk, phone, tablet and landing page). Dark is the default, as on a showroom kiosk. The choice is remembered in the browser and carries across the screens; nothing else is stored. To open a screen in a given mode, add `?theme=light` or `?theme=dark` to its address, for example `kiosk.html?theme=light`.

Colours live in CSS custom properties defined at the top of each source screen (`src/*.dc.html`), with a `:root[data-theme="light"]` block that overrides them.

## Run it

It is a static site with no build step needed to view it. React is bundled in `js/` and fonts are self-hosted, so it works offline.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Deploy it to Vercel, Netlify or GitHub Pages as a static site from the repo root.

## How it is built

- `src/*.dc.html` are the source screens, authored in a design canvas, and `src/canvas.json` is that canvas's layout.
- `js/dc-lite.js` is a small runtime that renders those sources outside the canvas with React:
  - `{{ }}` holes;
  - `<sc-if>` and `<sc-for>`;
  - event handlers;
  - the `class Component extends DCLogic` logic.
- `tools/build.py` turns each source into a root page. It swaps in the self-hosted fonts, local image paths and page links.

After editing a source screen:

```bash
python3 tools/build.py
```

## Data and honesty

- **Prices are ex-showroom Delhi, Aug–Oct 2026:**
  - Grand Vitara: Cars24 variant price update, Aug 2026, with the top strong hybrid confirmed on CarDekho, Sep 2026.
  - Hyryder, Victoris and Seltos: CarDekho Delhi price pages, Oct 2026.
  - Creta: Autocar India, 12 Oct 2026.
- **Efficiency** is the claimed ARAI figure.
- **Petrol** is ₹102.12/l (The Hans India, 11 Oct 2026).
- **Every source** is listed on the kiosk's Sources panel.
- **Proposals:** the Higher Ground Promise (60% buyback at 3 years / 45,000 km), the Service Pledge and Weekend Ownership are programme proposals, labelled "Proposed" on screen.
- **Tablet sessions** are illustrative samples. Nothing typed into the prototype leaves the browser.
- **Photos:** the car photos are Maruti Suzuki images via CarDekho. The road scenes are AI-generated illustrations, not real locations.

## Licences

- React (MIT): `js/LICENSE-react.txt`.
- Outfit and Source Sans 3 (SIL Open Font License): `assets/fonts/*/LICENSE.txt`.
