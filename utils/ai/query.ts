import { z } from 'zod'
import { WizardPayload } from "../wizard/schema"
import { llm } from "./client"

const outputSchema = z.object({
  search_term: z.string().describe(''),
  category_hint: z.string().describe('')
})
const intentsOutputSchema = z.object({
  recipient_label: z
    .string()
    .describe("A 1–3 word Persian noun phrase naming the recipient, e.g. 'برادرت' or 'همکارت'"),
  // Length is enforced in code, not the schema: small local models don't reliably honor min/max
  // items and a 3-intent answer is still usable.
  intents: z.array(outputSchema).min(1),
});

export type OutputType = z.infer<typeof outputSchema>

const SYSTEM = `You are the query-generation layer of Bahane, a Persian gift-recommendation service.
Your only job is to convert structured wizard answers about a gift recipient into diverse, concrete product search intents for Iranian e-commerce sites (Digikala, Snapshop).

Rules:
- Produce exactly 6 intents that cover DIFFERENT product categories. Never repeat a category.
- search_term must be Persian, specific, and product-shaped (e.g. "هدفون بی‌سیم", "ست قهوه دمی", "کتاب رمان تاریخی"), never abstract ("هدیه خوب").
- Every intent must be realistically purchasable inside the budget range. Prefer categories where the budget buys something of quality; if the budget is low for a category, aim for accessory-tier items in that category instead.
- Anti-preferences are HARD constraints: never propose anything in a disliked category, anything touching an allergy, or anything the recipient already owns.
- Free-text answers carry the most signal — read them carefully and let them override generic chip-based assumptions.
- recipient_label is how the waiting screen will refer to the recipient; derive it from the relationship (partner → "عزیزت", parent → "پدر/مادرت", friend → "دوستت", colleague → "همکارت", etc.) or from the free text if it names them.
- Output only the JSON. No prose.`

const describeUserPayload = (p: WizardPayload): string => {
  const line = (label: string, value: string | string[] | null | undefined): string => {
    const multipleValues = Array.isArray(value)
    return `${label}: ${multipleValues ? value.join(',') : value}`
  }
  const free = (label: string, text: string) => (text ? `${label}: <<<${text}>>>` : null);

  const lines = [
    "##Target",
    line('age range', p.target.ageRange),
    line('gender', p.target.gender),
    line('relationships', p.target.relationships),
    free('notes', p.target.freeText),
    "##Occasion",
    line('occasion', p.occasion.occasion),
    line('vibe', p.occasion.vibe),
    free('notes', p.occasion.freeText),
    "##Interests",
    line('interests', p.interests.interests),
    free('notes', p.interests.freeText),
    "##Avoid",
    line('dislikes', p.antiPrefs.dislikes),
    line('allergies', p.antiPrefs.allergies),
    line('already owns', p.antiPrefs.alreadyOwns),
    free('notes', p.antiPrefs.freeText),
    "##Budget",
    line('min (toman)', p.budget.min?.toString()),
    line('max (toman)', p.budget.max?.toString()),
  ]

  return lines.join("\n")
}

export async function getLLMOutput (payload: WizardPayload, signal: AbortSignal) {
  return await llm().generate({ schema: intentsOutputSchema, system: SYSTEM, user: describeUserPayload(payload), signal })
}