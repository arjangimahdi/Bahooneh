# 05 — The Latency Challenge: Waiting Room UX Strategy

## Why This Is a Product Problem, Not Just a Spinner

A blank spinner for 5–15 seconds on a task the user perceives as "just searching" will read as broken or slow, driving abandonment before results even load — directly destroying the affiliate funnel this entire product is built on.

The product strategy is to **reframe the wait as visible AI work**, which:

- Increases perceived value ("this is doing something smart for me," justifying the wait)
- Sets accurate expectations (so 15 seconds feels intentional, not broken)
- Creates a natural moment to reinforce personalization (referencing the user's own inputs back to them)

## Sequential Dynamic Loading States (Required for MVP)

Instead of a single loading spinner, the waiting room must show a **sequence of distinct, staged "AI thinking" states**, each tied to a real (or realistically-paced) backend step.

| Stage | Approx. Duration | Copy Example | Visual Treatment |
|---|---|---|---|
| 1. Understanding | 1–2s | "Understanding what makes [Recipient] tick..." | References Step 1/3 inputs directly (e.g., recipient's interests) |
| 2. Query Generation | 2–3s | "Thinking of gift ideas across [X] categories..." | Show category chips animating in, pulled from Step 3 selections |
| 3. Searching Partners | 3–6s | "Checking real-time prices and availability..." | Show partner site logos (Digikala, Snapshop) cycling/pulsing |
| 4. Filtering | 2–3s | "Filtering out anything they already have or dislike..." | Subtly reference Step 4 anti-preference inputs |
| 5. Finalizing | 1–2s | "Putting together your shortlist..." | Progress bar nearing completion |

### Product requirements for this experience

- Stages must be **personalized**, referencing the user's actual wizard inputs (recipient traits, interests, anti-preferences) — this is what separates "AI thinking" theater from a generic progress bar, and reinforces perceived intelligence of the product.
- Total staged duration should **loosely track actual backend timing** but must have sensible min/max clamps per stage so the experience doesn't feel janky if the real backend responds faster or slower than expected.
- If total wait exceeds a defined upper threshold (e.g., 20s), the UI must show a reassurance state (e.g., "Still working — great gifts take a little extra thought") rather than appearing stuck, to prevent perceived-failure abandonment.
- **No dead air:** every visual state must be actively animating or updating; a static, unchanging screen for more than ~2 seconds is treated as a UX defect.

## Failure / Timeout Handling

- Define a hard timeout (e.g., 25–30s). If exceeded, fail gracefully with an apology state and a retry CTA — never leave the user on an infinite loading state.
- If scraping returns a partial or empty result set after the wait, transition into the empty/low-result state defined in [06 — Results & Edge Cases](06-results-and-edge-cases.md) rather than treating it as a hard error.

---

Related: [04 — System Flow](04-system-flow-and-architecture.md) · [Roadmap Phase 4 — Waiting Room](../roadmap/phase-4-waiting-room.md)
