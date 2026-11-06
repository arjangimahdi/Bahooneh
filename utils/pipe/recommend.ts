import { WizardPayload } from "../wizard/schema";
import { ErrorCode, RecommendEvent } from "./events";
import { getLLMOutput } from "../ai/query";
import { LLMError } from "../ai/provider";
import { partners } from "../partners/shops";
import { fetchCandidates, toResultItem } from "./fetchCandidates";
import { applyHardFilters } from "./filters";

const toErrorCode = (error: unknown, signal: AbortSignal): ErrorCode => {
    if (signal.aborted) return "timeout";
    if (error instanceof LLMError) return "ai_unavailable";
    return "internal";
};

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
        const kept = toResultItem(filtered);

        yield { type: "stage", stage: "assembling" };

        yield { type: "result", items: kept, failedPartners: failedPartners };
    } catch (error) {
        if (!signal.aborted) console.error("[pipe/recommend] failed", error);
        yield { type: "error", code: toErrorCode(error, signal) };
    }
}
