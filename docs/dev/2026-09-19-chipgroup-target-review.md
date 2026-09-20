# Review — `ChipGroup` & `TargetStep`

**Date:** 2026-09-19
**Files:** `components/ui/ChipGroup.tsx`, `components/wizard/steps/target.tsx`
**Baseline:** `pnpm lint` clean · `tsc --noEmit` **fails** (1 error, see #1)
**Update:** all findings applied — `lint`, `tsc` and `build` pass. See resolution log at the end.

Overall: the shape is right — chips read from the option constants, labels go through `chipLabel`, state lives in the store, `fieldset/legend` gives each group an accessible name. The problems are in typing and in a few habits that will multiply across the other four steps if they're not fixed now.

---

## ChipGroup

### 1. Typecheck error — `T` is unconstrained *(blocker)*
```
ChipGroup.tsx(22): Argument of type 'string' is not assignable to parameter of type 'T'.
```
`chips` is `readonly string[]` but `onChange` wants `T`, so `onChange(id)` can't compile. `T` is only referenced by `onChange`, which is why it can't be inferred at the call site either and you had to write `<ChipGroup<AgeRange>>`.

**Fix:** derive `T` from `chips`:
```ts
interface Props<T extends string> {
    chips: readonly T[];
    selected: readonly T[];
    onChange: (id: T) => void;
    …
}
```
`chips={AGE_RANGES}` then infers `T = AgeRange`, `selected` is checked against the same union, and the explicit `<ChipGroup<AgeRange>>` annotations in `target.tsx` can be deleted.

### 2. `group` and `chips` are not tied together *(should fix)*
Nothing stops `group="gender" chips={AGE_RANGES}`, which renders raw ids. Once #1 is in place, this can be closed with a mapping type: `group: G`, `chips: readonly ChipId<G>[]` where `ChipId<G> = keyof Dictionary["chips"][G]`. Optional, but cheap and it eliminates a whole class of copy‑paste bugs across five steps.

### 3. `selected` as an array for single-select groups *(should fix)*
Every call site in `TargetStep` builds `target.x ? [target.x] : []` — three times. Either:
- accept `selected: T | readonly T[] | null` and normalise inside, or
- split into a `mode: "single" | "multi"` prop (or two components) so single groups take `value: T | null` and multi groups take `values: T[]`.

Multi-select groups (vibe, interests, dislikes, allergies, owns) are coming in steps 2–4; decide the API now.

### 4. No deselect *(should fix — spec)*
Clicking a selected chip calls `onChange(id)` again, so a user cannot clear age/gender. Spec §03 says every step is non-blocking; "I don't want to say" should be possible. Either emit `onChange(null)` when the clicked chip is already selected (single mode), or leave toggling to the caller and document it — but pick one, because the multi groups will need toggle semantics regardless.

### 5. Accessibility nits
- `hint` is rendered inside `<legend>` with literal parentheses — put it in a `<span>` after the label with `ms-1` and drop the `()`; screen readers read "open paren".
- Chips are `aria-pressed` buttons, fine for multi-select. For single-select groups a `role="radiogroup"` with `role="radio"` + `aria-checked` is the semantically correct pattern. Not urgent, but worth doing if #3 introduces a `single` mode anyway.

### 6. Style nits
- `variant="primary"` is hardcoded; expose it (or drop the prop from `Chip` if only one variant is ever used in groups).
- `legend` has `mb-3` and the fieldset has `gap-3` — one of them is redundant.
- Export: `export default` here vs named exports for every other `ui` component. The barrel already re-exports it as `ChipGroup`; make it a named export for consistency.

---

## TargetStep

### 7. `useEffect` + `console.log` *(remove)*
Debug leftover. It also runs on every keystroke because `target` changes reference on each patch.

### 8. Spreading `...target` into `setStepDraft` *(should fix)*
`setStepDraft` already merges: `{ ...state.draft[stepId], ...stepDraft }`. Passing `{ ...target, ageRange: id }` is redundant and subtly wrong — it snapshots the whole slice from this render, so if two patches ever land in the same tick the second overwrites the first's field. Send only the field: `patchStepDraft("target", { ageRange: id })`.

### 9. Subscribing to the whole slice *(minor, decide once)*
`useWizardStore(s => s.draft.target)` re-renders the whole step on every keystroke. As discussed, it's cheap here; but if you want granular subscriptions, do it uniformly in all steps rather than mixing styles. A small `useStepDraft("target")` hook wrapping the selector + a bound `patch` would remove the `patchStepDraft("target", …)` repetition across five steps.

### 10. Import hygiene
- `import { AgeRange, Gender, Relationship }` → `import type { … }` (they're types; `isolatedModules` prefers it and it disappears after #1 anyway).
- Import order is mixed (`react` after project imports). Not enforced by ESLint here, so cosmetic.

### 11. Validation error is not surfaced
`Textarea` has an `error` prop and the dictionary has `wizard.target.error`, but nothing passes it. Once the step schema/`canProceed` gate is back (the shell no longer passes `canProceed`), show the message after the user presses Next with an invalid step — not on first render.

### 12. `maxLength={500}`
Magic number; `FREE_TEXT_MAX` exists in `options.ts` for exactly this.

---

## Suggested order

1. #1 — fix the generic so `tsc` passes; remove the explicit `<ChipGroup<…>>` annotations.
2. #7, #8, #10, #12 — five-minute cleanups in `target.tsx`.
3. #3 + #4 — settle the single/multi API and deselect before writing the occasion step.
4. #2, #5, #6, #9, #11 — as you go.

---

## Resolution log

| # | Resolution |
|---|---|
| 1 | `ChipGroup<G extends ChipGroupId, T extends ChipId<G>>` — `T` inferred from `chips`; explicit `<ChipGroup<…>>` removed from `target.tsx`. |
| 2 | `ChipId<G> = keyof Dictionary["chips"][G] & string` ties `chips` to `group`; `group="gender" chips={AGE_RANGES}` is now a type error. |
| 3 | Discriminated props: default `single` (`value: T \| null`, `onChange(id \| null)`) and `mode="multi"` (`value: T[]`, `onChange(ids)`). Single call sites pass the field directly. |
| 4 | Single mode: clicking the selected chip emits `null`. Multi mode toggles in/out of the array. |
| 5 | Hint is a `<span class="ms-1">` without parentheses. Single mode renders `role="radiogroup"` / `role="radio"` + `aria-checked`; multi keeps `aria-pressed`. `Chip` omits `aria-pressed` when a `role` is given. |
| 6 | `variant` prop (default `primary`); `mb-3` removed; named export `ChipGroup` + `ChipGroupProps`. |
| 7 | `useEffect`/`console.log` removed. |
| 8 | `patch({ ageRange })` — no more `...target` spread. |
| 9 | `useStepDraft(stepId)` → `[draft, patch]` in `store.ts`; step subscribes to its own slice and `patch` is pre-bound. |
| 10 | Type-only imports gone with #1; import order tidied. |
| 11 | `utils/wizard/validation.ts` (plain functions, replaces the removed zod schema). Store gained `showErrors`: `next()` refuses to advance and sets it when the current step is invalid; `prev`/`setStep`/`reset` clear it. `useStepError(stepId)` feeds `Textarea error`. |
| 12 | `maxLength={FREE_TEXT_MAX}`. |
