# 02 — Problem Discovery & User Insight

## Target User Segments (MVP)

| Segment | Description | Primary Trigger |
|---|---|---|
| **The Last-Minute Panicker** | Remembers an occasion 24–72h out | Urgency, needs fast, confident answers |
| **The Thoughtful Planner** | Plans ahead but wants a *better* gift than "the obvious one" | Wants to avoid generic/cliché gifts |
| **The Distant Relative/Colleague** | Doesn't know the recipient intimately (e.g., corporate Secret Santa, in-law) | Low personal knowledge, high social risk of a "wrong" gift |

## Why a Wizard, Not a Chatbot (MVP Decision)

A free-form chatbot was considered and explicitly **rejected for MVP** in favor of a structured wizard because:

- Structured inputs are directly mappable to a predictable JSON schema for the AI query-generation step (lower AI hallucination risk, more reliable structured output).
- Chips/tags reduce user cognitive load — recognition is easier than recall, especially for anxious, time-pressured users.
- A wizard has clear, measurable funnel steps (critical for the KPI strategy in [08 — Success Metrics](08-success-metrics.md)).
- Free-text-only chat has a higher drop-off risk for users who "don't know what to type" — the exact anxiety we're solving for.

## Guiding Design Principle

> **Chips lower the floor, free-text raises the ceiling.**

Every step must let a user finish with zero typing, while still allowing power users to inject hyper-specific detail. This principle is carried through every step of the wizard.

---

Related: [01 — Vision & Business Model](01-vision-and-business-model.md) · [03 — Wizard Specification](03-wizard-specification.md)
