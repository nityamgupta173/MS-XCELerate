# Higher Ground Discovery: kiosk prototype v2

A working exhibit for a Maruti Suzuki XCELerate 2026 entry. One codebase, one static deployment, six routes. **Concept prototype. Not an official Maruti Suzuki product.**

| Route | Surface |
|---|---|
| `/demo` | Judge mode: every surface side by side, seven claims, three guided tours. `/` redirects here. |
| `/kiosk?channel=nexa` (or `arena`, `pod`) | Floor kiosk, a fixed 1080 × 1920 canvas scaled to fit any screen |
| `/m#<payload>` | Buyer's phone, opened by the kiosk's QR code |
| `/expert` | Product expert's tablet |
| `/council` | SUV Council dashboard (simulated pilot data, labelled) |
| `/about` | Method, sources, prior art, economics, limitations |

Start with `WALKTHROUGH.md` for the demo script, `CHANGELOG.md` for deviations and errors found, and `DATA_GAPS.md` for what is not yet verified.

## Run it

Needs Node 20 or later.

```bash
npm install
```

```bash
npm run dev
```

Open `http://localhost:5173/demo`.

## Build and check

```bash
npm run build
```

The build fails if any fact lacks a source, a date or a status; if anything references a fact that does not exist; if Hindi is missing a buyer-facing string; or if a digit is typed into copy or JSX outside a slot.

```bash
npm test
```

```bash
npx playwright install chromium
```

```bash
npm run e2e
```

`npm run e2e` builds nothing: run `npm run build` first. It starts the preview server itself. `npm run screenshots` re-captures every kiosk state in both skins and both languages and rebuilds the contact sheets in `screenshots/`.

## Deploy to Vercel

The app is a static Vite build. `vercel.json` sets the build command, the output folder and the rewrites that send every route to `index.html`.

1. Push this repository to GitHub.
2. In Vercel, import the repository. The framework preset "Vite" is detected; no environment variables are needed.
3. Deploy, then open `/demo`.

After deploying, scan the kiosk's QR code with a real phone to confirm `/m` opens: that only works from the deployed address.

## How the numbers stay honest

- Every figure on screen is rendered by one of four wrappers: `Fact` (a value in `facts.json`, tap for its source), `Calc` (a computed value, tap for the formula and inputs), `Sim` (simulated council data, tap for the seed) or `Ui` (a counter or the buyer's own input).
- A missing value renders as a **Verify** chip. A value whose sources disagree carries a small flag.
- Three checks enforce it: the build-time lint (`scripts/lint-numbers.ts`), the data check (`scripts/validate-data.ts`) and a browser audit that walks every text node on every kiosk state (`tests/e2e/helpers.ts`, `untracedNumbers`).

## Refresh the data

The JSON in `src/data/` is generated. Edit the sources in `data-src/` and rebuild.

1. Prices, specs, ratings, fuel prices: edit `data-src/build-data.ts`. Each value takes a source object; update the `R` date at the top when you re-check.
2. Questions and answers: edit `data-src/build-qa.ts`.
3. Regenerate and check:

```bash
npm run data:build
```

```bash
npm run data:check
```

```bash
npm run data:docs
```

`data:docs` rewrites `SOURCES.md`, the table in `DATA_GAPS.md` and `HINDI_REVIEW.md`.

If the petrol price changes, the three expected values in `tests/unit/domain.test.ts` ("the checks in the brief") change with it. Update them and note the old and new figures in `CHANGELOG.md`.

To turn a Verify chip into a number, replace `gap('...')` with a real source in `build-data.ts` and give the fact a value.

## Add a rival

1. In `data-src/build-data.ts`, add a block to `rivals` modelled on the Creta: a price source, model facts (airbags, crash rating, boot, ground clearance, warranty) and its variants.
2. Add its id to the `shortlist` lists at the bottom of the file for the channels that should offer it.
3. Add a one-line neutral description to both copy files as `sl.<id>.desc`. No disparagement.
4. Run the three data commands above, then `npm run build`.

## Edit the Hindi

- Interface strings: `src/data/copy.hi.json`. Keys match `copy.en.json`. Keep every `{...}` slot exactly as it is; the data check fails if English and Hindi cite different facts.
- Answers and question variants: `data-src/build-qa.ts`, then `npm run data:build`.
- `HINDI_REVIEW.md` lists every Hindi string beside its English for a native speaker. It has **not** been reviewed yet.
- No digits in copy: write `{f:fact.id}` for a fact or `{n:1000}` for a unit base.

## Car images

Placeholders name the shot needed. See `IMAGES_NEEDED.md`. Drop `public/cars/<id>.webp` in and rebuild.

## Live AI mode

Not built in this version. The Q&A is a deterministic offline library (`src/domain/qa.ts`), which is what judges see. `CHANGELOG.md` explains why.

## Architecture

```
data-src/        canonical data entry (TypeScript), generates src/data/*.json
src/data/        facts, models, rivals, Q&A, copy (English, Hindi), zod schemas
src/domain/      pure functions: calculators, recommend, compare, costs, qa, payload, profile, simulate
src/state/       kiosk state machine (typed reducer + transition table), session bus
src/ui/          Fact / Calc / Sim / Ui / Verify / Proposed, FixedStage, ImageSlot, styles
src/surfaces/    kiosk, Phone, Expert, Council, Demo, About
scripts/         data check, number lint, docs generator, contact sheets
tests/unit/      calculators, engine (14 cases), comparison, Q&A matcher, payload, consent, state machine
tests/e2e/       persona flows, idle wipe, consent, QR round trip, sync, audits, tours, screenshots
```

- **State**: the kiosk is a typed reducer with an explicit transition table (`src/state/kioskMachine.ts`). The whole session is one serialisable object, which is what makes the wipe, judge mode and the QR payload simple to prove.
- **Sync**: surfaces share a record in `localStorage` and signal changes over `BroadcastChannel`. There is no server. The phone reads only its URL hash, which is why the QR path carries no personal data.
- **Offline**: the service worker precaches the app, data and fonts.
- **Kiosk hardening for a real device**: text selection and the context menu are disabled, a full-screen button is in the header, and a screen wake-lock is requested. On real hardware also run the browser in kiosk mode, disable pinch zoom at the OS level and set the device to relaunch the page on boot.

## Measured

Local preview build, Chromium, 12 Oct 2026: kiosk route JavaScript 205 KB gzipped (budget 300 KB); largest contentful paint about 0.4 s for both `/kiosk` and `/m`. Lighthouse itself would not launch in the build environment, so there are no Lighthouse scores: run it against the deployed URL.
