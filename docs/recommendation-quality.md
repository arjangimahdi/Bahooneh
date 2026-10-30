# Recommendation quality — backlog

Ideas for making recommendations good enough that people actually buy. Bahane's results often felt weak or unconvincing; this list is how BYadet should do better. Nothing here is needed for the first Digikala wiring, except the items marked **[With Digikala]**, which are cheap to build in from the start and painful to add later.

Legend: **[With Digikala]** = build together with the Digikala adapter, **[Later]** = after the full pipeline works end to end, **[Research]** = no code, find out first.

Rule of thumb for every item: the AI decides *what kind of gift*; code decides *where to search* and *what is good enough to show*.

---

## Phase 0 — Find out why Bahane's results felt bad

### - [ ] 1. Diagnose Bahane's results **[Research]**
- **Why:** each kind of failure needs a different fix. More questions or more shops will not fix bad products.
- **How:** write 10 realistic recipients (parent, coworker, art-loving friend, new-house couple, teenager, etc.), run each through Bahane, and label every bad result as one of:
  - **wrong idea** (a phone case for a book lover),
  - **right idea, bad product** (cheap-looking, no reviews, bad photo, too cheap for the budget),
  - **right product, unconvincing** (weak or generic reason).
- **Done when:** a short note in `docs/` says which failure type is most common. Use it to reorder the phases below.

---

## Phase 1 — Shop access and safety (Digikala)

Digikala's search endpoint is **unofficial** (the one its own website uses). There is no published rate limit, it can change without notice, and its terms must be reviewed before production (spec 09).

### - [ ] 2. Decide hosting location **[Research]**
- **Why:** many Iranian sites block, slow down or challenge traffic from foreign IPs. What matters is the *server's* IP, not the user's (CORS does not apply to server-side requests).
- **Options:** host in Iran (ArvanCloud, Liara, an Iranian VPS), or host abroad and route shop requests through an Iranian server.
- **Done when:** the hosting choice is written down.

### - [ ] 3. Small, polite rate-limit experiment **[Research]**
- **Run from the chosen hosting location**, not only from a laptop in Iran.
- **Steps:** one request (status, time, JSON or HTML?); 1 request/second for 1 minute; a burst of 10–15 at once (one real user search); read headers (`Retry-After`, `X-RateLimit-*`, protection-service headers).
- **Done when:** results are saved in a short note in `docs/`.

### - [ ] 4. Cache search results **[With Digikala]**
- Cache each shop's answer per normalised search phrase for about 30–60 minutes. The product link always shows the live price.
- **Done when:** the same phrase twice within the cache window makes one shop request.

### - [ ] 5. Limit parallel requests per shop **[With Digikala]**
- At most ~3 requests to the same shop at the same time; the rest wait their turn (still inside the 8 s per-shop budget).

### - [ ] 6. Cool-down after repeated 429/403 **[With Digikala]**
- If a shop answers 429 or 403 several times in a row, skip it for a few minutes and report `partner_failed` immediately instead of waiting 8 s on every request.

### - [ ] 7. Per-shop monitoring **[With Digikala]**
- Log status code and response time per shop request. Never log user answers or free text.

### - [ ] 8. Official access **[Later]**
- Apply to Digikala's affiliate/partner program (official links, commission, written permission, maybe a data feed). Do the same for every shop added later.

---

## Phase 2 — Better products from the same shop

### - [ ] 9. Use quality signals **[With Digikala]**
- Read rating, review count and "best seller" signals from Digikala's response (check the saved sample file for the real field names).
- Prefer sorting by popular / top-rated instead of plain relevance; drop products with a low rating or very few reviews.

### - [ ] 10. Price floor **[Later]** (hard filters step)
- Items far below the budget feel thoughtless. Drop items under a floor (start with ~40% of the budget minimum, then tune).

### - [ ] 11. Giftability rules in AI step 2 **[Later]**
- Tell the curation model to drop things that are not giftable: spare parts, cables, basic groceries, cleaning supplies, items with bad photos. Prefer brands, nice packaging, personal items.

### - [ ] 12. Fewer, stronger, mixed results **[Later]**
- Show 3–5 confident picks instead of many average ones. Mix types: one safe and useful, one personal or emotional, one experience (class, tickets, subscription).

---

## Phase 3 — Better ideas

### - [ ] 13. Ideas first, then products **[Later]**
- AI step 1 produces gift *ideas* with a short reason ("a home coffee kit, because she just moved and loves cafés"), not only search phrases. The pipeline then finds the best product per idea.
- The result card shows idea + reason + product. People buy the idea.

### - [ ] 14. Fixed gift categories **[Later]**
- A typed list in code, e.g. `home_decor`, `kitchen`, `books`, `art_handmade`, `fashion`, `tech`, `beauty`, `sports`, `stationery`, `experience`.
- `category_hint` in the AI schema becomes `z.enum(GIFT_CATEGORIES)`, so the model cannot invent categories and the "no repeated category" cleanup is exact.
- The category text in the system prompt is **generated from the same list** (never typed by hand), so prompt and code cannot disagree.

---

## Phase 4 — Better questions

### - [ ] 15. Lifestyle question **[Later]**
- One chip question, placed inside an existing step (e.g. next to interests) so the wizard does not get longer: homebody, traveller, busy office worker, student, new parent, sporty, creative.
- Add it to the wizard types, schema, `fa.ts` chips, and one line in `describeUserPayload`.
- **Watch:** wizard completion rate. Every extra question loses some users.

### - [ ] 16. Follow-up questions only when answers are thin **[Later]**
- If the answers carry little signal, the AI asks 1–2 short questions ("useful or decorative?"). Users with rich answers skip this.

---

## Phase 5 — More shops, chosen by the person

### - [ ] 17. Shop list with category tags **[Later]**
- A typed list in code: each shop has the gift categories it covers. Digikala covers everything and is always included as the safety net.
  - e.g. home store → `home_decor`, `kitchen`; handmade marketplace → `art_handmade`, `home_decor`; bookstore → `books`.
- For each idea: shops whose tags include its category, plus Digikala, minus shops in cool-down.
- **Shop names never go in the AI prompt.** The AI picks the category; code picks the shops. Adding a shop = one adapter file + one line in the list, with no prompt change.

### - [ ] 18. Background catalog for small / concept stores **[Later]**
- Small stores often have no JSON and few products that change slowly. Instead of asking them while the user waits, a scheduled job collects their products slowly (e.g. once a day, a few requests per minute) into our own database; user searches read our database.
- Use a simple HTML fetch + parser (e.g. `cheerio`) when needed, never a headless browser per user request.
- Re-check price and stock live only for the final few products before showing them.

---

## Phase 6 — Learn from users

### - [ ] 19. Feedback on result cards **[Later]**
- A small 👍 / 👎 (or "more like this") per card. Track it next to click-through, the North Star metric (spec 08).
