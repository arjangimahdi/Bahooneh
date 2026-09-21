# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Bahooneh (بهوونه, package name `bahane`) is a Persian-language (fa-IR, RTL) AI gift-recommendation app. A 5-step wizard collects who the gift is for, the occasion, interests, anti-preferences, and budget; an AI layer turns that into structured product search intents; a scraper queries Iranian partner shops (Digikala, Snapshop) in real time; the results page shows real purchasable products with a per-item AI rationale and affiliate links. Bahooneh sells nothing itself.

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
pnpm test         # vitest run
pnpm vitest run path/to/file.test.ts   # single test file
pnpm vitest -t "test name"             # single test by name
pnpm ollama:up / ollama:down / ollama:logs   # docker compose for a local Ollama — the compose file does not exist yet
```

There are no tests yet; vitest is installed but unconfigured.

## Next.js version note

This is **Next.js 16** with React 19 and the React Compiler enabled (`reactCompiler: true` in `next.config.ts`). APIs and conventions differ from older Next.js. Check `node_modules/next/dist/docs/` before using an API you're unsure about, and heed deprecation notices. `next dev` will re-create an `AGENTS.md` (and a `CLAUDE.md` containing `@AGENTS.md`) with this same warning; those were intentionally removed from the tree in favor of this file.

## Architecture

Current state: only the home page exists (`app/page.tsx`, `app/layout.tsx`, `components/Logo.tsx`, `i18n/`). The wizard (`/wizard`, linked from the home CTA), API route, AI layer, scraper, waiting room, and results page are not built yet. `i18n/fa.ts` already contains all the copy for those screens, so it's a good map of what's planned.

### i18n — every user-facing string goes through `t()`

- `i18n/fa.ts` is the single dictionary (`as const`). `i18n/index.ts` derives a `TKey` union of dotted paths from it, so `t("wizard.target.title")` is type-checked; a typo is a compile error. `t()` interpolates `{var}` placeholders and returns the key itself on a miss so gaps are visible.
- `chipLabel(group, id)` is the untyped lookup for data-driven option ids (`chips.*` in the dictionary). Chip ids are meant to be stable identifiers shared with `utils/wizard/options.ts`; the dictionary keys under `chips` must match those ids exactly.
- `locale`/`dir` are exported constants (`fa-IR`, `rtl`) and set on `<html>` in the root layout. Use `toPersianDigits()` for any number shown to users and `formatToman()` for currency.
- Never hardcode Persian (or English) UI text in components — add a key to `fa.ts`.

### Styling

Tailwind v4 via `@tailwindcss/postcss`. The palette is defined as CSS variables in `app/globals.css` (light + `prefers-color-scheme: dark`) and mapped into Tailwind with `@theme inline`, giving utilities like `bg-accent`, `text-ink`, `text-muted`, `border-line`, `bg-surface`, `bg-accent-soft`, `rounded-card`. Use these tokens rather than raw Tailwind colors so dark mode stays correct. Font is Vazirmatn via `next/font/google`, exposed as `--font-vazirmatn`.

Because the app is RTL, prefer logical/direction-agnostic utilities (`ps-`, `pe-`, `ms-`, `me-`, `start`/`end`) over `pl-`/`pr-`/`left`/`right`.

### Planned dependencies already in `package.json`

`@anthropic-ai/sdk` (AI query-intent generation), `zod` (validating the wizard payload and the AI's structured output), `zustand` (client-side wizard state — session-level only, no persistence across accounts per spec). Path alias `@/*` maps to the repo root.

## Conventions

- Components use 4-space indentation; `i18n/` files use 2-space. Match the file you're in.
- Server components by default; only add `"use client"` where state/effects are needed (the wizard and waiting room will need it).
- Do not use any comments inside code.
