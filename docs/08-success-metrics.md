# 08 — Success Metrics (KPIs)

## North Star Metric

**Affiliate Click-Through Rate (CTR) on recommended products** — the single metric that most directly reflects whether the AI's recommendations were good enough for a user to act on, and the core revenue driver.

## Funnel-Stage KPIs

| Stage | Metric | Why It Matters |
|---|---|---|
| Wizard Entry | Wizard Start Rate (landing → Step 1) | Measures whether the value proposition is compelling enough to begin |
| Wizard Progress | **Per-step drop-off rate** (Step 1→2, 2→3, 3→4, 4→5) | Identifies exactly which step causes friction (e.g., if Step 4 anti-preferences causes drop-off, its "optional" framing may need revisiting) |
| Wizard Completion | **Wizard Completion Rate** (Step 1 start → Step 5 submit) | Primary top-of-funnel health metric for the entire product |
| Waiting Room | **Bounce Rate During the 5–15s Wait** | Directly measures whether the staged "AI thinking" UX is successfully preventing abandonment |
| Waiting Room | **Perceived Wait Satisfaction** (optional post-result micro-survey, e.g., thumbs up/down on "was the wait worth it?") | Qualitative signal to validate the loading UX strategy |
| Results | **Zero/Low-Result Rate** (% of sessions ending in the empty or partial-result edge case) | Measures scraper/query-generation quality; high rate signals AI query generation or partner coverage issues |
| Results | **Affiliate Click-Through Rate (CTR)** | North Star — % of completed sessions where the user clicks at least one affiliate link |
| Post-Click | **Affiliate Conversion Rate** (tracked via partner postback where available) | Ultimate revenue validation, though partly outside direct product control |
| Quality/Trust | **Refinement Rate** (% of users who use "Refine my answers" instead of abandoning after low-quality results) | Indicates whether users trust the system enough to iterate rather than leave |

## Recommended MVP Success Thresholds

*Illustrative — to be calibrated post-launch.*

| Metric | Illustrative Target |
|---|---|
| Wizard Completion Rate | ≥ 60% |
| Waiting Room Bounce Rate | ≤ 15% |
| Zero-Result Rate | ≤ 5% of completed wizards |
| Affiliate CTR | ≥ 25% of sessions with results |

These are starting hypotheses for calibration, not committed targets — revisit after initial data collection.

---

Related: [01 — Vision & Business Model](01-vision-and-business-model.md) · [Roadmap Phase 6 — Analytics & Launch](../roadmap/phase-6-analytics-and-launch.md)
