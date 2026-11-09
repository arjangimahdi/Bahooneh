import { normaliseText, toWords } from "../text/normalise";
import { BUDGET_CEILING, BUDGET_FLOOR } from "../wizard/options";
import type { WizardPayload } from "../wizard/schema";
import type { BudgetDraft } from "../wizard/types";
import { ALLERGY_KEYWORDS, DISLIKE_KEYWORDS, OWNS_KEYWORDS } from "./filterKeywords";
import type { Candidate, Product } from "./types";

const WORD_SUFFIXES = new Set(["ها", "های", "هایی", "ی", "ای"]);

const wordMatches = (word: string, keyword: string): boolean =>
    word === keyword || (word.startsWith(keyword) && WORD_SUFFIXES.has(word.slice(keyword.length)));

export function titleHasKeyword(titleWords: string[], keyword: string): boolean {
    const keywordWords = toWords(keyword);
    if (keywordWords.length === 0) return false;

    const lastIndex = keywordWords.length - 1;

    for (let start = 0; start + keywordWords.length <= titleWords.length; start += 1) {
        const matches = keywordWords.every((word, index) => {
            const titleWord = titleWords[start + index];
            return index === lastIndex ? wordMatches(titleWord, word) : titleWord === word;
        });
        if (matches) return true;
    }

    return false;
}

function blockedKeywords(payload: WizardPayload): string[] {
    const { dislikes, allergies, alreadyOwns } = payload.antiPrefs;

    return [
        ...dislikes.flatMap((id) => DISLIKE_KEYWORDS[id]),
        ...allergies.flatMap((id) => ALLERGY_KEYWORDS[id]),
        ...alreadyOwns.flatMap((id) => OWNS_KEYWORDS[id]),
    ];
}

export function withinBudget(product: Product, budget: BudgetDraft): boolean {
    return product.price >= (budget.min ?? BUDGET_FLOOR) && product.price <= (budget.max ?? BUDGET_CEILING);
}

function removeDuplicates(candidates: readonly Candidate[]): Candidate[] {
    const slots: (Candidate | null)[] = [];
    const slotByKey = new Map<string, number>();

    for (const candidate of candidates) {
        const { id, title } = candidate.product;
        const keys = [`id:${id}`, `title:${normaliseText(title)}`];
        const found = keys.flatMap((key) => slotByKey.get(key) ?? []);

        if (found.length === 0) {
            keys.forEach((key) => slotByKey.set(key, slots.length));
            slots.push(candidate);
            continue;
        }

        const slot = Math.min(...found);
        const merged = [...new Set(found)].flatMap((index) => slots[index] ?? []);
        const cheapest = [...merged, candidate].reduce((best, next) =>
            next.product.price < best.product.price ? next : best
        );

        for (const index of found) {
            if (index === slot) continue;
            slots[index] = null;
            slotByKey.forEach((value, key) => {
                if (value === index) slotByKey.set(key, slot);
            });
        }

        slots[slot] = cheapest;
        keys.forEach((key) => slotByKey.set(key, slot));
    }

    return slots.filter((candidate) => candidate !== null);
}

export function applyHardFilters(candidates: readonly Candidate[], payload: WizardPayload): Candidate[] {
    const blocked = blockedKeywords(payload);

    const allowed = candidates.filter(({ product }) => {
        if (!product.available) return false;
        if (!withinBudget(product, payload.budget)) return false;

        const titleWords = toWords(product.title);
        return !blocked.some((keyword) => titleHasKeyword(titleWords, keyword));
    });

    return removeDuplicates(allowed);
}
