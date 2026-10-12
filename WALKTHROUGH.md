# Walkthrough

Replace `<URL>` with the deployed address. Everything runs in one browser tab at `<URL>/demo`.

## Sixty-second script

Open `/demo`. Press **Arrived Upgrader at NEXA** and talk over it.

> "This is the kiosk on a NEXA floor. Our buyer is cross-shopping the Hyryder and the Seltos, so we ask what is on their list and five quick questions. *(about 10 s)*
>
> The match is the Grand Vitara strong hybrid, and every number on it opens its source. Notice the second box: the kiosk says the Seltos is ahead on crash rating. We do not hide that. *(20 s)*
>
> Against the Hyryder, same plant, same engine, same warranty since July 2024, and used prices at parity. The badge gap is a perception gap, and this is the proof. *(30 s)*
>
> There is no discount anywhere. In its place: a guaranteed buyback at 60 per cent against a typical 82, labelled as a proposal. *(40 s)*
>
> The buyer books a weekend with the car and asks for a person. On the right, the product expert already has the brief, a suggested conversation that starts with what the rival does better, and a clock: leads contacted within 24 hours is ten points on the dealer scorecard. *(55 s)*
>
> The kiosk is not the idea. It is how the organisation we are proposing behaves on the showroom floor."

If there is time for one more click, press claim **3**: a NEXA kiosk recommending the Arena Victoris, with dual credit.

## Claim by claim, for the deck appendix

| # | Claim | Where | What to do | What proves it |
|---|---|---|---|---|
| 1 | Maruti Suzuki wins on ownership, not on price | `<URL>/demo`, claim 1 | Tap claim 1. The kiosk opens Compare, "After you buy". | Buyback and repeat-repair rows, each marked "Proposed: pilot". Then tap **Costs** for the running-cost calculator. No discount, offer or on-road price exists on any screen; ask "any discount?" on **Ask** and it routes to the product expert with the reason. |
| 2 | Honest selling: we say where the rival is better | `<URL>/demo`, claim 2 | Tap claim 2. Grand Vitara petrol automatic against the Creta. | "The honest read" names the Creta's advantages first (power, boot space, warranty). The tick marks sit on the Creta's side for those rows. |
| 3 | Channels are fenced but not hostile | `<URL>/demo`, claim 3 | Tap claim 3. A NEXA kiosk, family buyer, safety first. | The match is the Arena Victoris, with "this showroom is credited either way". Tap **Book a weekend with it** and book: "Booked at [NEAREST ARENA OUTLET]. This showroom is credited too." |
| 4 | The badge gap is closed with proof | `<URL>/demo`, claim 4 | Tap claim 4. Grand Vitara against the Hyryder, "After you buy". | The "Same car, two badges" panel: Bidadi, same powertrain, same warranty since July 2024, resale ratio 1.04. Then **Promises**: 60% floor against about 82% typical. |
| 5 | Technology hands off to people | `<URL>/demo`, claim 5 | Tap claim 5. | The product expert's tablet shows the live session: what the buyer told the kiosk, their questions, the lead-contact clock and a three-step conversation with "Do not lead with discount". |
| 6 | Privacy by design | `<URL>/demo`, claim 6 | Tap claim 6. The kiosk opens "Send to my phone". | Itemised notice, unticked box, Send disabled. Type a number, tick, send: the tablet shows it masked until the booking is confirmed. For the no-number path, run the **Budget Stylist** tour: QR only. To see the wipe, open `<URL>/kiosk?channel=nexa&idle=5&warn=5`, start a session and wait. |
| 7 | Management can run on it | `<URL>/demo`, claim 7, or `<URL>/council` | Tap claim 7. | Funnel, rival mix, content gaps with owner and SLA, leads within 24 hours against floor and target, cross-channel referrals. Every figure is labelled simulated; live demo sessions are counted separately. |

## Direct links

| Surface | Link |
|---|---|
| Judge mode | `<URL>/demo` |
| Kiosk, NEXA / Arena / public pod | `<URL>/kiosk?channel=nexa`, `?channel=arena`, `?channel=pod` |
| Product expert's tablet | `<URL>/expert` |
| SUV Council | `<URL>/council` |
| Method, sources, limitations | `<URL>/about` |
| Buyer's phone | Scan the QR on the kiosk, or use "Open on its own" in judge mode |

## If something goes wrong on the day

- **Reset all** (top right of judge mode) clears every surface.
- The kiosk works offline after its first load, so a dropped connection does not stop the demo.
- A real phone can scan the QR only when the page is opened from the deployed address, not from `localhost`.
