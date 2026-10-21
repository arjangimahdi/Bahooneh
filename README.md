# BYadet · به یادت

A Persian (fa-IR, RTL) AI gift finder. Answer five short questions about the person you're buying for (who they are, the occasion, their interests, what to avoid, and your budget). BYadet turns your answers into a short list of real products you can buy from Iranian online shops, with a one-line reason for each pick.

BYadet sells nothing itself. Every result links to the shop's own product page.

## Status

- **Done:** home page, the five-step wizard (validation, saved progress, tests), and the brand (logo, Keepsake palette).
- **In progress:** the recommendation stream on `/result`, currently on mock data.
- **Next:** waiting-room and results UI, the AI step that turns answers into search queries, and live search on Digikala and Snapshop.

## Getting started

Requires Node 22+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm test` | Run the unit tests (vitest) |
| `pnpm typecheck` | Type-check with `tsc` |
| `pnpm lint` | Lint with ESLint |
| `pnpm fill` | Click through the wizard in an open Chrome tab (needs Chrome started with `--remote-debugging-port=9222`) |

## Stack

Next.js 16 (App Router, React 19, React Compiler) · Tailwind CSS v4 · zustand · zod · vitest · Vazirmatn font.

## Docs

- `docs/01`–`docs/10`: the product spec (vision, users, wizard, system flow, waiting room, results, scope, metrics, risks, glossary).
- `docs/wizard-gaps.md`: the wizard checklist.
- `docs/brand/`: logo and palette boards.
- `CLAUDE.md`: architecture and code conventions.
