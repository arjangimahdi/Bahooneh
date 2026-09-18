# 06 — Results Page & Edge Case Handling

## Standard Results Page Requirements

Each recommended product card must display:

| Element | Requirement |
|---|---|
| Product image & title | Pulled from real-time scraped data |
| Price | Must reflect current scraped price, clearly stated in local currency |
| Source partner | Which partner site (Digikala, Snapshop, etc.) the product comes from |
| AI Rationale | A short, human-readable explanation of *why this was chosen* (traceable back to the AI's relevance rationale) — a key trust and differentiation feature, not decorative copy |
| Affiliate CTA | Prominent "View on [Partner]" button that fires the tracked affiliate link |

## Required Edge Cases (MVP Must Handle)

| Edge Case | Product Requirement |
|---|---|
| **Zero results** (query too narrow, e.g., extremely low budget + niche interest) | Show an empathetic empty state; offer a one-click action to relax the budget or return to Step 4/5 to broaden anti-preferences/budget, rather than a dead end |
| **Partial results** (fewer than a target minimum, e.g., <3 products) | Still display what was found; do not block on a minimum threshold; optionally show a soft prompt suggesting the user broaden inputs for more options |
| **One partner site fails/times out** | Flow continues with results from remaining partner(s); do not fail the whole request for a single partner outage |
| **Budget too low for category** (e.g., $10 budget + "Tech & Gadgets" interest) | AI/backend should attempt graceful category substitution or accessory-tier suggestions within budget, with rationale copy acknowledging the constraint (e.g., "Within your budget, here's a tech-themed pick...") rather than silently returning unrelated items |
| **Conflicting inputs** (e.g., anti-preference contradicts an interest, such as disliking "gadgets" while selecting "Tech" as an interest) | Anti-preferences take precedence as hard filters over interest-based inclusion |
| **User abandons wizard mid-flow** | Not in MVP scope to resume via account (no accounts in MVP); session-level state persistence only |

## Retry & Refinement

The results page must include a clear path back into the wizard (e.g., "Refine my answers") that preserves prior inputs, encouraging iteration rather than starting over — directly supports the completion-rate and result-satisfaction KPIs.

---

Related: [05 — Waiting Room UX](05-waiting-room-ux.md) · [08 — Success Metrics](08-success-metrics.md) · [Roadmap Phase 5 — Results & Edge Cases](../roadmap/phase-5-results-and-edge-cases.md)
