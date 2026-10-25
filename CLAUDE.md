# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BYadet (به یادت, package name `byadet`; formerly Bahooneh) is a Persian-language (fa-IR, RTL) AI gift-recommendation app. A 5-step wizard collects who the gift is for, the occasion, interests, anti-preferences, and budget; an AI layer turns that into structured product search intents; a scraper queries Iranian partner shops (Digikala, Snapshop) in real time; the results page shows real purchasable products with a per-item AI rationale and affiliate links. BYadet sells nothing itself.

Brand boards (logo variants, Keepsake palette) live in `docs/brand/`. The brandmark is a tangerine gift tag tilted 20° with a jet-black sparkle, drawn as SVG in `components/Logo.tsx` and `app/icon.svg`.

The product spec lives in `docs/01`–`docs/10` and is the source of truth for behavior. Read the relevant doc before building a feature — especially `03-wizard-specification.md`, `04-system-flow-and-architecture.md`, `05-waiting-room-ux.md`, and `06-results-and-edge-cases.md`. Key non-negotiables from the spec:

- Budget and anti-preferences are **hard filters**, not ranking signals. Anti-preferences win over conflicting interests.
- The AI must emit **multiple diverse structured query intents** (search term, category hint, rationale, constraint tags), never freeform prose.
- One partner failing must not fail the request — show partial results.
- The 5–15s AI + scrape round-trip is a first-class UX problem; the waiting room shows staged progress (`waiting.stages.*` in the dictionary).
- No user accounts, payments, or image search in the MVP.

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`).

```bash
pnpm dev          # next dev
pnpm build        # next build
pnpm start
pnpm lint         # eslint (flat config, eslint-config-next core-web-vitals + typescript)
pnpm typecheck    # tsc --noEmit
pnpm format       # prettier --write . (format:check to verify)
pnpm test         # vitest run
pnpm vitest run path/to/file.test.ts   # single test file
pnpm vitest -t "test name"             # single test by name
pnpm fill         # drive an open /wizard tab through every step (Chrome with --remote-debugging-port=9222, dev server running); --until=N stops after step N
pnpm ollama:up / ollama:down / ollama:logs   # docker compose for a local Ollama — the compose file does not exist yet
```

Tests live next to the code as `*.test.ts` (`vitest.config.ts` sets up the `@` alias). Wizard logic is covered by `utils/wizard/schema.test.ts` and `utils/wizard/store.test.ts`; the store test stubs `sessionStorage` so persistence and migrations run in Node.

## Next.js version note

This is **Next.js 16** with React 19 and the React Compiler enabled (`reactCompiler: true` in `next.config.ts`). APIs and conventions differ from older Next.js. Check `node_modules/next/dist/docs/` before using an API you're unsure about, and heed deprecation notices. `next dev` will re-create an `AGENTS.md` (and a `CLAUDE.md` containing `@AGENTS.md`) with this same warning; those were intentionally removed from the tree in favor of this file.

## Architecture

Current state:

- **Home** (`app/page.tsx`) and the root layout with the brand header.
- **Wizard** (`/wizard`) is complete. `components/wizard/WizardShell.tsx` renders the five step components from `components/wizard/steps/`, owns navigation and submit, and pushes to `/result`. State lives in a zustand store (`utils/wizard/store.ts`) persisted to `sessionStorage` (key `byadet-wizard`, versioned with a `migrate`; bump the version when the draft shape changes). Validation is zod in `utils/wizard/schema.ts`: per-step schemas whose issue messages are `TKey`s, so `t(error)` renders them. Steps 1–3 pass with any chip OR free text; budget min/max are required hard limits. Option ids live in `utils/wizard/options.ts`. Open gaps are tracked in `docs/wizard-gaps.md`.
- **Recommend pipeline** is scaffolded on mock data: `POST /api/recommend` (`app/api/recommend/route.ts`) validates with `wizardSchema` (400 on a bad payload) and streams NDJSON `RecommendEvent`s from the async generator in `utils/pipe/recommend.ts`; `hooks/useRecommend.ts` reads the stream on `/result`. The event contract lives in `utils/pipe/events.ts` (`RecommendEvent`, `STAGES`, `ERROR_CODES`, `encodeEvent`, `isTerminalEvent`), the domain types in `utils/pipe/types.ts` (`Product`, `ResultItem`, `PARTNER_IDS`), and the zod checker in `utils/pipe/schema.ts` (`recommendEventSchema`, `parseEvent`). See "Stream message rules" below.
- **Not built yet:** the waiting room (`components/result/Lobby.tsx`), the results view (`ProductsView.tsx`), the real AI layer, and the partner scrapers. `i18n/fa.ts` already contains their copy, so it's a good map of what's planned.

UI primitives (`Button`, `Chip`, `ChipGroup`, `Input`, `Textarea`, `RangeSlider`) live in `components/ui/` and use `tailwind-variants`.

### Stream message rules

The `/api/recommend` stream is a contract between server and client. Do not break these:

1. **One event per line, written only by `encodeEvent`.** A line is `JSON.stringify(event) + "\n"`: exactly `"\n"`, no trailing space, no other newlines. Never build lines by hand.
2. **Read only through `parseEvent`.** Never `JSON.parse(line) as RecommendEvent` or annotate a `JSON.parse` result as an event. `parseEvent` never throws and returns `null` for blank, broken or unknown lines; skip those.
3. **Imports flow one way: `types.ts` ← `events.ts` ← `schema.ts`.** `types.ts` imports nothing from the pipe, `events.ts` uses only `import type` from `types.ts` and never imports zod, and only code that reads untrusted data imports `schema.ts`.
4. **Type and schema change together.** `recommendEventSchema` ends in `satisfies z.ZodType<RecommendEvent>`, so a field added to the type breaks the build until the schema matches. Fields added only to the schema are not caught by the compiler; the tests in `utils/pipe/events.test.ts` are. Adding a stage or error code means updating `STAGES`/`ERROR_CODES`, the union, the schema, `SAMPLES` in the tests, and `waiting.stages.*` in `fa.ts` (checked by `utils/pipe/stageCopy.test.ts`).
5. **Every stream ends with exactly one terminal event, `result` or `error`** (`isTerminalEvent`), and nothing is sent after it. A single shop failing is a `partner_failed` event followed by a partial `result`, never an `error` (spec: one partner failing must not fail the request).

Product ids are `"<partner>:<partnerProductId>"`, and `Product.url` is the canonical page without tracking; affiliate links go in `ResultItem.affiliateUrl`.

### i18n — every user-facing string goes through `t()`

- `i18n/fa.ts` is the single dictionary (`as const`). `i18n/index.ts` derives a `TKey` union of dotted paths from it, so `t("wizard.target.title")` is type-checked; a typo is a compile error. `t()` interpolates `{var}` placeholders and returns the key itself on a miss so gaps are visible.
- `chipLabel(group, id)` is the untyped lookup for data-driven option ids (`chips.*` in the dictionary). Chip ids are meant to be stable identifiers shared with `utils/wizard/options.ts`; the dictionary keys under `chips` must match those ids exactly.
- `locale`/`dir` are exported constants (`fa-IR`, `rtl`) and set on `<html>` in the root layout. Use `toPersianDigits()` for any number shown to users and `formatToman()` for currency.
- Never hardcode Persian (or English) UI text in components — add a key to `fa.ts`.

### Styling

Tailwind v4 via `@tailwindcss/postcss`. The palette (Keepsake: Powder Petal ground, Jet Black ink, Tangerine Dream accent) is defined as CSS variables in `app/globals.css` (light + `prefers-color-scheme: dark`) and mapped into Tailwind with `@theme inline`, giving utilities like `bg-accent`, `text-ink`, `text-muted`, `border-line`, `bg-surface`, `bg-accent-soft`, `bg-highlight`, `bg-blossom`, `rounded-card`. Use these tokens rather than raw Tailwind colors so dark mode stays correct. Tangerine fails contrast as text or as a focus ring on the light ground: use it only for fills (with `text-accent-ink` on top), and use `ink` for text and focus outlines. Supporting colors (`highlight`, `blossom`, `secondary`) should stay small accents. Font is Vazirmatn via `next/font/google`, exposed as `--font-vazirmatn`.

Because the app is RTL, prefer logical/direction-agnostic utilities (`ps-`, `pe-`, `ms-`, `me-`, `start`/`end`) over `pl-`/`pr-`/`left`/`right`.

### Dependencies

`@anthropic-ai/sdk` (planned: AI query-intent generation), `zod` (the wizard payload now, the AI's structured output later), `zustand` (client-side wizard state, session-level only, no accounts per spec), `tailwind-variants`, and `playwright` (dev only, for `pnpm fill`). Path alias `@/*` maps to the repo root.

## Conventions

- Formatting is Prettier (`.prettierrc.json`): 4-space indentation everywhere, double quotes, semicolons, trailing commas (es5), 120-char lines. Run `pnpm format` before committing; `eslint-config-prettier` keeps ESLint out of style questions. Markdown and `docs/` are not formatted.
- Server components by default; only add `"use client"` where state/effects are needed (the wizard and waiting room will need it).
- Do not use any comments inside code.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
