# Bahooneh — working notes

- Product spec: `docs/01`–`10`. Section numbers in code comments (e.g. "spec §05") refer to these.
- UI is Persian-only and RTL. **Never put Persian (or any user-facing) text in components** — add a key to `src/i18n/fa.ts` and use `t("...")` / `chipLabel(group, id)`. Option ids in `lib/wizard/options.ts` are English slugs and must stay that way; they are what the AI sees.
- Amounts are Toman everywhere. Partner adapters convert at the boundary.
- AI calls go through `lib/ai/provider.ts` (`StructuredLLM.generate({system, user, schema})`). Providers: `providers/ollama.ts` (default, JSON-schema `format`) and `providers/anthropic.ts` (`messages.parse` + `zodOutputFormat`). Keep system prompts stable and per-request data in the user message; keep zod schemas simple (no min/max items) because local models don't honor them — cap in code.
- Hard constraints (budget, anti-preferences) live in `lib/pipeline/filters.ts` and run before curation; the model is a second line, never the only one.
- Verify with `npm run typecheck && npm run lint && npm test && npm run build`. Tests mock the AI modules; a live run needs Ollama running (`ollama pull qwen2.5:7b`) or `AI_PROVIDER=anthropic` + a key.
- Next 16: read `node_modules/next/dist/docs/` before using an unfamiliar API. React Compiler + `react-hooks/set-state-in-effect` lint are on — derive state or use `useSyncExternalStore` instead of setState in effects.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
