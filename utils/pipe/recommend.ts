import { curate, type CuratePick } from "../ai/curate";
import { LLMError } from "../ai/provider";
import { getLLMOutput } from "../ai/query";
import { byId, partners } from "../partners/shops";
import type { WizardPayload } from "../wizard/schema";
import type { ErrorCode, RecommendEvent } from "./events";
import { fetchCandidates } from "./fetchCandidates";
import { applyHardFilters } from "./filters";
import type { ResultItem } from "./types";

const toErrorCode = (error: unknown, signal: AbortSignal): ErrorCode => {
    if (signal.aborted) return "timeout";
    if (error instanceof LLMError) return "ai_unavailable";
    return "internal";
};

const toResultItems = (picks: readonly CuratePick[]): ResultItem[] =>
    picks.map(({ candidate: { product }, rationale }) => ({
        product,
        rationale,
        affiliateUrl: byId.get(product.partner)?.affiliateUrl(product) ?? product.url,
    }));

export async function* recommend(payload: WizardPayload, signal: AbortSignal): AsyncGenerator<RecommendEvent> {
    try {
        yield { type: "stage", stage: "understanding" };
        const { recipient_label, intents } = await getLLMOutput(payload, signal);
        signal.throwIfAborted();

        yield {
            type: "stage",
            stage: "ideating",
            categoryCount: intents.length,
            recipientLabel: recipient_label,
        };

        yield { type: "stage", stage: "fetching", partners: partners.map((p) => p.id) };
        const { candidates, failedPartners } = await fetchCandidates({
            budget: payload.budget,
            intents,
            partners,
            signal,
        });

        for (const partner of failedPartners) {
            yield { type: "partner_failed", partner };
        }

        yield { type: "stage", stage: "filtering", candidateCount: candidates.length };
        const filtered = applyHardFilters(candidates, payload);

        yield { type: "stage", stage: "assembling" };
        const picks = await curate({ payload, candidates: filtered, recipientLabel: recipient_label, signal });

        yield { type: "result", items: toResultItems(picks), failedPartners };
    } catch (error) {
        if (!signal.aborted) console.error("[pipe/recommend] failed", error);
        yield { type: "error", code: toErrorCode(error, signal) };
    }
}
