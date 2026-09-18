# 03 — Core User Journey: The 5-Step Wizard

## Wizard Design Principles (Apply to All Steps)

| Principle | Requirement |
|---|---|
| Dual input | Every step shows predefined clickable **chips/tags** (multi-select unless noted) AND a visible, prominent **"Custom/Other"** free-text field — never hidden behind a secondary click |
| Progressive disclosure | Only one step visible at a time; persistent progress indicator (e.g., "Step 3 of 5") |
| Non-blocking | No step should be fully mandatory to the point of dead-ending the user — see per-step validation rules below |
| Editability | User can navigate back to any previous step without losing later inputs |
| State persistence | Wizard state persists across a session (e.g., on accidental refresh) for MVP; full account-based persistence is out of scope |

## Step-by-Step Specification

### Step 1 — The Target

- **Goal:** Establish who the gift is for
- **Chips:**
  - *Age range:* Kid, Teen, 20s, 30s, 40s, 50+
  - *Gender:* Male, Female, Non-specific
  - *Relationship:* Partner, Parent, Sibling, Friend, Colleague, Boss, In-law
- **Free-text:** "Describe them in your own words" (e.g., "my introverted younger brother who just moved out")
- **Validation:** At least one chip OR free-text required

### Step 2 — Occasion & Vibe

- **Goal:** Establish context and emotional tone
- **Chips:**
  - *Occasion:* Birthday, Anniversary, Wedding, Apology, Graduation, Housewarming, Just Because, Corporate/Work
  - *Vibe:* Romantic, Funny/Playful, Formal/Professional, Practical, Luxurious, Sentimental
- **Free-text:** "Tell us more about the occasion"
- **Validation:** Occasion chip OR free-text required; Vibe is optional (multi-select)

### Step 3 — Interests & Lifestyle

- **Goal:** Establish what the recipient loves
- **Chips:** Tech & Gadgets, Reading, Outdoor/Adventure, Fashion & Style, Home & Cooking, Gaming, Fitness & Wellness, Art & Creativity, Music, Travel
- **Free-text:** "Any specific hobbies, brands, or interests?"
- **Validation:** Multi-select chips (recommend 2–5); free-text always available and can stand alone

### Step 4 — Anti-Preferences *(Crucial)*

- **Goal:** Prevent bad/duplicate/unwanted recommendations
- **Chips:**
  - *Dislikes:* No Clothes, No Perfume/Scented Items, No Gag Gifts, No Food/Edibles
  - *Allergies:* Nuts, Fragrance, Latex
  - *Already Owns:* dynamically suggested based on Step 3 interests (e.g., "Already has a PS5" appears if Gaming was selected)
- **Free-text:** "Anything else they hate, are allergic to, or already own?"
- **Validation:** Fully optional — but UI should visually encourage completion (see below) since this step is the primary quality/differentiation lever

### Step 5 — Budget

- **Goal:** Set hard financial constraints
- **Chips:** Preset ranges (e.g., "Under $25", "$25–$50", "$50–$100", "$100+") for fast selection
- **Free-text / input:** Custom min/max numeric range input, always visible alongside chips
- **Validation:** Min and Max required before "Find Gifts" CTA activates; Max must be ≥ Min; enforce a sane currency-aware minimum floor

## Special UX Note on Step 4 (Anti-Preferences)

This step is **crucial** because it's the primary differentiator versus generic e-commerce search — it's what makes recommendations feel *intelligent* rather than *generic*.

- Frame this step positively in copy (e.g., "Help us avoid a miss" rather than "Restrictions"), since negatively-framed steps historically see higher skip/drop-off rates.
- Dynamically surface "Already Owns" chips based on Step 3 selections (e.g., selecting "Gaming" surfaces chips like "Already has a PS5," "Already has a Switch") to reduce typing effort and increase completion.
- Even though optional, this step should never be visually deprioritized — treat its completion rate as a leading indicator of recommendation quality (see [08 — Success Metrics](08-success-metrics.md)).

## Exit / Submit State

Upon completing Step 5, the primary CTA ("Find Their Perfect Gift" or similar) triggers the backend flow described in [04 — System Flow](04-system-flow-and-architecture.md) and transitions the user into the Waiting Room experience ([05 — Waiting Room UX](05-waiting-room-ux.md)).

---

Related: [02 — Users & Problem Discovery](02-users-and-problem-discovery.md) · [Roadmap Phase 1 — Wizard](../roadmap/phase-1-wizard.md)
