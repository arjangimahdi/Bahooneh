# 09 — Risks & Open Questions

| Risk / Question | Category | Notes |
|---|---|---|
| Real-time scraping reliability against partner sites (rate limits, anti-bot measures, layout changes breaking scrapers) | Technical | Scraper fragility directly threatens the core latency and result-quality promises of the product |
| AI query generation quality at the "long tail" of hyper-specific free-text input | Product/AI | Anti-preference and custom free-text fields are the differentiator, but also the highest hallucination/misinterpretation risk surface |
| Affiliate partner terms (rate limits on scraping, API vs. scraping legality/ToS per partner) | Legal/Business | Needs legal review per partner before scraping in production |
| Cold-start trust — will users trust an AI-curated shortlist enough to click through to an unfamiliar recommendation flow? | Product/UX | The AI rationale copy is the primary trust-building lever; worth dedicated qualitative testing |
| Session-only state (no accounts) — how much completion/re-engagement value is lost by not persisting across visits? | Product Scope | Deliberate MVP trade-off; should be a key input into prioritizing "Smart Event Calendar" in the roadmap |

## Tracking

Each risk above maps to a mitigation item in the roadmap:

- Scraper reliability → [Phase 3 — Scraper & Partners](../roadmap/phase-3-scraper-and-partners.md)
- AI long-tail quality → [Phase 2 — AI Query Generation](../roadmap/phase-2-ai-query-generation.md)
- Partner legal/ToS → [Phase 0 — Foundation](../roadmap/phase-0-foundation.md)
- Cold-start trust → [Phase 5 — Results & Edge Cases](../roadmap/phase-5-results-and-edge-cases.md)
- Session-only state → [Phase 7 — Post-MVP](../roadmap/phase-7-post-mvp.md)
