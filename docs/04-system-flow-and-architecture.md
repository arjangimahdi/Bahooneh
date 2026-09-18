# 04 — System Flow & Technical Constraints

> This document describes system *behavior and contracts* for product/engineering alignment. It intentionally excludes implementation code.

## End-to-End Flow

```
[User completes 5-step wizard]
        ↓
[Frontend packages wizard state as structured payload]
        ↓
[Backend receives payload]
        ↓
[AI Layer: translates payload into structured JSON of
 specific, searchable product query intents]
        ↓
[Backend Scraper Service: queries partner e-commerce
 sites in real-time using the AI-generated queries]
        ↓
[Backend: filters/ranks scraped results against
 budget + anti-preferences]
        ↓
[Frontend: displays real, purchasable products with
 affiliate links + AI-generated rationale per product]
```

## Contract Between Wizard and AI Layer

The AI's job is to convert **subjective, human, multi-select wizard input** into **objective, structured, machine-searchable query intents**. The AI output must be structured (not freeform prose) so the scraper layer can consume it deterministically.

Each AI output should resolve to a set of discrete **search intents**, where each intent carries:

| Field | Description |
|---|---|
| Search term / query string | Suitable for an e-commerce search bar |
| Category hint | e.g., "electronics," "books," "home goods" |
| Relevance rationale | A short, human-readable reason this product category fits the input — surfaced to the end user on the results page |
| Constraint tags | Carried through from Step 4/5 (excluded categories, price ceiling) for the scraper/filter layer to enforce |

**Requirement:** The AI should generate **multiple diverse query intents per request** (not just one), so the scraper has enough breadth to return a shortlist rather than a single item. This directly affects perceived recommendation quality and the waiting-room pacing.

## Scraper Service Expectations

- Must query **multiple partner sites** per request where feasible, to maximize result diversity and resilience if one partner returns few/no results.
- Must respect the **budget range** from Step 5 as a hard filter, not a soft ranking signal.
- Must be resilient to partial failure: if one partner site fails or times out, the flow should continue with whatever partial results are available rather than failing the entire request (see [06 — Results & Edge Cases](06-results-and-edge-cases.md)).
- Real-time nature is a deliberate MVP choice (freshness/accuracy of price & availability over speed) — this is the direct cause of the latency challenge below.

## Non-Functional Constraint: Latency

This is the single most important UX constraint in the MVP and is treated as a first-class product problem, not an engineering afterthought.

| Constraint | Value |
|---|---|
| Expected scraping + AI round-trip latency | 5–15 seconds |
| Product mandate | This delay must not be "dead time" from the user's perspective |

See [05 — Waiting Room UX](05-waiting-room-ux.md) for the product response to this constraint.

---

Related: [Roadmap Phase 2 — AI Query Generation](../roadmap/phase-2-ai-query-generation.md) · [Roadmap Phase 3 — Scraper & Partners](../roadmap/phase-3-scraper-and-partners.md)
