# Wizard gaps — checklist

Findings from comparing the BYadet wizard against `docs/03-wizard-specification.md` and the reference project (Bahane). Work through them in order; each item says what is missing, where, and how to know it is done. Tick the box when finished.

Legend: **[Spec]** = spec requirement, **[Ref]** = Bahane does it, **[Bug]** = incorrect behaviour, **[Polish]** = optional.

---

## Phase 1 — Decisions that change the schema (do these first)

### - [ ] 1. Persist the draft across refreshes **[Spec] [Ref]**
- **Missing:** `utils/wizard/store.ts` uses plain `create()`. Spec 03 "State persistence" requires the draft to survive an accidental refresh. Today a refresh on `/wizard` loses everything, and a refresh on `/result` makes `payload` null and redirects to `/wizard`.
- **Where:** `utils/wizard/store.ts`, `app/result/page.tsx`, `components/wizard/WizardShell.tsx`.
- **Guide:**
  - Wrap the store with zustand `persist` + `createJSONStorage(() => sessionStorage)` (session only, no accounts in MVP).
  - Use `partialize` to persist `draft` and `currentStepIndex` only, not `errors` or actions.
  - Persisted state is not available during SSR, so add a hydration guard (see Bahane `src/lib/useHydrated.ts`, built on `useSyncExternalStore`) and render nothing until hydrated. Otherwise you get hydration mismatches, and the `/result` redirect can fire before the draft is loaded.
  - Pick a storage key name (`byadet-wizard`) and think about what happens if the draft shape changes later (`version` / `migrate`).
- **Done when:** fill half the wizard, hard refresh, and you land on the same step with your answers. Refreshing `/result` after a complete wizard does not bounce you away.

### - [x] 2. Decide the validation policy for steps 1 and 2 **[Spec]**
- **Decision:** option (a): steps 1 and 2 are valid with any chip OR free text, shown as one step-level error; `relationship` is now multi-select (`relationships[]`).
- **Missing:** Spec 03 says step 1 needs "at least one chip OR free text" and step 2 needs "occasion chip OR free text" (non-blocking, no dead ends). Currently:
  - `targetSchema` requires `ageRange`, `gender` and `relationship` (all single-select).
  - `occasionSchema` requires an `occasion` chip; free text cannot replace it.
- **Where:** `utils/wizard/schema.ts`, `utils/wizard/types.ts`, `utils/wizard/store.ts` (`emptyDraft`), step components, `i18n/fa.ts`.
- **Decide first (this is a product decision, not just code):**
  - (a) Follow the spec: fields optional, step valid if any chip OR free text (Bahane's approach).
  - (b) Keep it strict on purpose and update the spec/docs so they agree.
- **Related question:** should `relationship` be multi-select (Bahane: `relationships[]`)? Spec says "multi-select unless noted". If you change it, remember the payload field name changes and the AI prompt will read it.
- **Guide for (a):** use a step-level `.refine(...)` like `interestsSchema` already does (the pattern is right there), with a new error key in `fa.ts`.
- **Done when:** step 1 passes with only free text, step 2 passes with only free text, and the chosen behaviour is documented.

---

## Phase 2 — Bugs and spec deviations

### - [x] 3. Free-text minimum length blocks optional fields **[Spec]**
- **Decision:** Dropped the minimum entirely: removed `FREE_TEXT_MIN` and `common.tooShort`; optional free text only has the max length.
- **Missing:** `FREE_TEXT_MIN = 5` applies to every optional free-text field. Typing "ab" in an optional box blocks Next with "write at least 5 characters", against the non-blocking principle.
- **Where:** `utils/wizard/schema.ts` (`optionalFreeText`), `utils/wizard/options.ts`.
- **Guide:** either drop the minimum for optional fields, or keep it only where the free text is the *sole* input of a step (e.g. when it replaces chips, see item 2). Decide, then make schema and error messages match.
- **Done when:** a short note in an optional field never blocks navigation.

### - [x] 4. Budget step: slider vs. empty draft **[Bug]**
- **Decision:** Option (a): `RangeSlider` got an `empty` variant (no fill, muted thumbs, no value readout) used while `min` or `max` is `null`; the draft stays `null` and the required check stays.
- **Missing:** `budget.min/max` are `null` initially, but the slider shows the full floor–ceiling range (`?? BUDGET_FLOOR` / `?? BUDGET_CEILING`). The user sees a range selected, presses Next, and gets "enter min and max".
- **Where:** `components/wizard/steps/budget.tsx`, `utils/wizard/store.ts` (`emptyDraft.budget`).
- **Guide:** pick one: (a) show the slider as "unset" until touched, (b) default `min`/`max` to real values (then the "required" error becomes unreachable and the spec's "Min and Max required" is satisfied by default), (c) hide the slider thumbs until the user interacts.
- **Done when:** what the user sees on the slider always matches what will be validated and submitted.

### - [x] 5. Budget step: wrong error for max above the ceiling **[Bug]**
- **Decision:** Split into a separate `wizard.budget.errorCeiling` issue with a `{ceiling}` placeholder; `budget.tsx` passes both `floor` and `ceiling`.
- **Missing:** `budgetSchema` reports `max > BUDGET_CEILING` with `wizard.budget.errorOrder` ("max must be ≥ min"), which is misleading. The slider is capped but the typed input is not.
- **Where:** `utils/wizard/schema.ts` (`superRefine`), `i18n/fa.ts`.
- **Guide:** split the check into two issues with separate messages (add `errorCeiling` with a `{ceiling}` placeholder), or clamp the typed value. Also check that `rangeError` in `budget.tsx` passes the placeholders it needs (it passes only `floor` today).
- **Done when:** typing 50,000,000 shows a message that says what is actually wrong.

### - [x] 6. Check preset ↔ custom range behaviour **[Polish]**
- **Decision:** Verified by reading the code, not in a browser: preset sets min/max, deselect keeps the numbers, any slider/input edit clears the preset, reselect overwrites min/max. No change.
- **Missing:** deselecting a preset chip sets `preset: null` but keeps `min`/`max`. Probably fine, but confirm it is intentional and that editing the inputs/slider clears the preset (it does).
- **Where:** `components/wizard/steps/budget.tsx`.
- **Done when:** you have tried select → deselect → edit → select in the browser and the chip state always matches the numbers.

### - [x] 7. Finish the submit path **[Bug]**
- **Decision:** The shell owns submit: removed the unused `onSubmit`/`isSubmitting` props and the debug log; local `isSubmitting` state guards double submit and drives the button's loading state.
- **Missing:**
  - `WizardShell` accepts `onSubmit` and `isSubmitting` props that nothing uses, so the button's `loading` state can never show.
  - A leftover `console.log("here")` in `submit`.
  - Nothing prevents a double click.
- **Where:** `components/wizard/WizardShell.tsx`, `components/wizard/WizardNavigation.tsx`, `app/wizard/page.tsx`.
- **Guide:** decide who owns "submit": the shell (navigate to `/result`) or the page (via `onSubmit`). Remove the unused props or wire them. Guard against double submit.
- **Done when:** one clear submit path, no debug logging, no unused props.

---

## Phase 3 — Boundaries and robustness

### - [x] 8. `/api/recommend` should return 400 for an invalid payload **[Ref]**
- **Decision:** `safeParse` before the stream starts; a bad payload returns `{ error: "invalid_payload", issues }` with status 400.
- **Missing:** the route calls `wizardSchema.parse(body)` inside a `try/catch` that returns 500 for everything, including bad input. A `ZodError` is a client error.
- **Where:** `app/api/recommend/route.ts`.
- **Guide:** use `safeParse` and return `{ error: "invalid_payload", issues }` with status 400 (see Bahane `src/app/api/recommend/route.ts`).
- **Done when:** `curl -X POST` with `{}` returns 400, not 500.

### - [x] 9. De-duplicate the "already owns" options **[Ref]**
- **Decision:** Added `ownsForInterests()` in `options.ts` (Set-based); the step and the store's pruning both use it.
- **Missing:** `interests.flatMap((i) => OWNS_BY_INTEREST[i])` has no de-duplication. It only works today because no two interests share an item.
- **Where:** `components/wizard/steps/antiPrefs.tsx` (and `pruneAlreadyOwns` in the store uses a `Set` already).
- **Guide:** `[...new Set(...)]`, or derive the list once in a helper in `utils/wizard/options.ts` and reuse it in the step and the store, so they cannot drift apart.
- **Done when:** adding a shared item to two interests in `OWNS_BY_INTEREST` shows it once.

---

## Phase 4 — Quality

### - [x] 10. Tests for the wizard logic **[Ref]**
- **Decision:** `schema.test.ts` and `store.test.ts` cover every case listed, including a persistence round trip and the v1→v2 migration via a stubbed `sessionStorage`.
- **Missing:** only `i18n/numberToWords.test.ts` exists. The schemas and store are pure logic and cheap to test.
- **Where:** new `utils/wizard/schema.test.ts` and `utils/wizard/store.test.ts` (vitest already includes `**/*.test.ts`; Bahane's `src/lib/wizard/schema.test.ts` is a template).
- **Cases to cover:**
  - each step schema: valid, invalid, and the chip-OR-free-text rules from item 2
  - budget: below floor, max < min, above ceiling, null values
  - store: `next()` blocks on invalid, `validateAll()` jumps to the first invalid step, changing interests prunes `alreadyOwns`, `reset()`
  - persistence round trip, if practical (item 1)
- **Done when:** `pnpm test` passes and fails when you break a rule on purpose.

### - [x] 11. Accessibility of errors and step changes **[Polish]**
- **Decision:** `ChipGroup` and the budget range error use `role="alert"` with `aria-describedby`; on step change the shell focuses the step's `h2` and scrolls to top.
- **Missing:**
  - `ChipGroup` renders its error as a plain `<p>`: no `role="alert"`, and the fieldset isn't linked to it with `aria-describedby` (`Textarea` already does this).
  - On step change there is no focus or scroll reset, so keyboard and screen-reader users stay at the old position.
- **Where:** `components/ui/ChipGroup.tsx`, `components/wizard/WizardShell.tsx`.
- **Guide:** link the error with `useId` + `aria-describedby` / `aria-invalid`; after `next/prev`, move focus to the step heading (`tabIndex={-1}` + `ref.focus()`) and scroll to top.
- **Done when:** you can complete the wizard by keyboard only and hear/see each error.

### - [x] 12. Nudge toward 2–5 interests **[Spec, Polish]**
- **Decision:** A muted hint under the chips at exactly 1 or more than 5 selections; never blocks.
- **Missing:** spec 03 step 3 recommends choosing 2–5 interests. Nothing hints at it (Bahane doesn't either).
- **Where:** `components/wizard/steps/interests.tsx`, `i18n/fa.ts`.
- **Guide:** a soft hint under the chips, not a validation rule (the step must stay non-blocking).

### - [ ] 13. Step in the URL **[Polish, optional]**
- **Missing:** the current step lives only in store state, so the browser Back button leaves the wizard instead of going to the previous step. Neither project does this.
- **Where:** `app/wizard/page.tsx`, `components/wizard/WizardShell.tsx`.
- **Guide:** sync the step with a search param (`/wizard?step=3`) or nested route segments. A good App Router exercise (`useSearchParams`, Suspense boundary). Do it after item 1 so the two do not fight over the source of truth.

---

## Housekeeping (not wizard code, but will bite you)

- [x] `CLAUDE.md` still says only the home page exists, "no tests yet", and the compose file is missing. Update it as the project grows.
- [x] `README.md` is the create-next-app boilerplate.
- [ ] `.env*` and `*.tsbuildinfo` are gitignored; the rebrand changes (BYadet logo, palette, `CLAUDE.md`) are still uncommitted on `feat/recommendation`.

## Suggested order

1 → 2 → 3 → 4 → 5 → 7 → 8 → 9 → 10 → 11 → 6 / 12 / 13

Items 1 and 2 first: they change the shape of the schema and the store, and the tests in item 10 should be written against the final shape.
