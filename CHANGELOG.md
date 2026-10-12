# Changelog

Newest first. Errors I made are listed as errors, not folded into "fixes".

## v2.0.0, 12 Oct 2026

### Figures that differ from the brief

- **Petrol price re-verified and kept** at ₹102.12 a litre (Delhi). The brief flagged it. It matches five published daily tables for 1 to 9 Oct 2026. The expected test values did not change.
- **₹5,477, not ₹5,476**, for monthly fuel on the Grand Vitara hybrid at 1,500 km. The brief's figure comes from multiplying an already-rounded number. The unit test asserts ₹5,477 and says why.
- **₹93,200, not ₹93,000**, for the Grand Vitara over Creta price gap, because the kiosk uses the exact variant prices.

### Errors I made during the build, and what I did

1. **The number lint was silently disabled for one build.** A regex edit left an empty alternative, so the JSX check skipped every line. I caught it on reading the output back and replaced the pattern. No digits had slipped into JSX text in the meantime (checked by the browser audit, which is independent of the lint).
2. **A word-boundary marker was written as a backspace character** in the lint's product-name allow-list, so "XL6" kept failing as a "number". Fixed.
3. **The Match screen overflowed the bottom bar**, hiding the main buttons. Found by the first browser run. The reasons moved into the display zone and the screen now clips nothing; an automated check fails the build if any kiosk screen overflows.
4. **Primary controls sat above the reach zone** on the hand-off chooser and the booking panel. Found by the reach-zone audit. Fixed with a display block above them.
5. **Buttons were nested inside buttons** (a tappable fact inside a card) on the hand-off cards and the tablet queue. Found by axe. Facts inside a control are now rendered as plain text.
6. **Fact labels with digits were untraced** on the About page and in popover titles. Found by the number audit. They are now marked as source metadata.
7. **The Nexon safety question was hidden** whenever the match was not the Brezza, which is exactly when an Arena family needs it. The question is now tied to the rival, not the model.
8. **The price question chip could fall off the list.** It is now always the last chip, so the buyer can see why the kiosk will not quote offers.
9. **Fuel prices displayed without paise** (₹102 for ₹102.12). Fixed.
10. **Hindi eyebrow text was letter-spaced and upper-cased**, which breaks Devanagari. Fixed.
11. **Sample leads on the tablet used plausible-looking phone numbers.** Replaced with zeros.
12. **Costs and Compare overflowed in Hindi** by up to 253 px. Chart height, paddings and the distance control were reworked.

### Deviations from the brief

- **No live AI mode.** `/api/ask` was not built. It could not be tested without a key, and an untested path in a judged exhibit is a risk with no upside: judges only ever see the offline library. `VITE_LIVE_AI` does nothing.
- **Not deployed.** The repository is ready for Vercel (`vercel.json`, static build); deployment is left to you.
- **Typed reducer instead of XState**, as proposed in `PLAN.md`.
- **Four attract panels, not three.** The brief asks for one per Higher Ground meaning and there are four meanings.
- **On-screen keyboard keys are 86 px wide with 12 px gaps.** Ten keys cannot fit a 1080 px canvas at 96 px with 24 px gaps. Every other primary control meets the 96 px rule.
- **The on-screen keyboard is Latin only.** Hindi buyers tap suggested questions or type in English letters; the matcher understands romanised Hindi.
- **Tablet, council, judge mode and About are English only.** The Hindi requirement covers the kiosk and phone.
- **Diesel rival variants are included**, although Maruti Suzuki sells none, because hiding them would hide a real advantage.
- **Up to six variants per model**, not two or three, for the two flagships.
- **No separate design-skill pass.** The visual design follows the brief's own rules (two skins from one token set, no logos, Devanagari-capable type) but was not run through a design review skill.
- **Lighthouse was not run**: it would not launch against the installed browser here. Load timing and bundle size were measured with Playwright instead and are in the README.
- **The independent review ran against the local build**, since there is no deployed URL yet.
- **Voice input**: not built (a stretch goal).

### Built

- Six routes from one codebase: kiosk (NEXA, Arena, pod), phone, product expert's tablet, SUV Council dashboard, judge mode, About.
- 411 facts with source, date and status; 59 Q&A intents in English and Hindi; 385 buyer-facing strings in both languages.
- Recommendation engine across both channels, with no-fit cases and plain statements when a rival wins the buyer's first priority.
- 80 unit tests and 37 browser tests, including three unattended persona tours, idle wipe, consent gating, QR round trip, cross-surface sync, an every-number-is-traced audit, a reach-zone audit and axe on every route.
