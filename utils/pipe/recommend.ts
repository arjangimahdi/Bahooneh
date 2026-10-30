import { WizardPayload } from "../wizard/schema";
import { ErrorCode, RecommendEvent } from "./events";
import { getLLMOutput } from "../ai/query";
import { LLMError } from "../ai/provider";
import { sleep } from "../partners/http";
import { assembleResults, filterCandidates, SIMULATED_PARTNERS, simulateFetch } from "./simulate";

const SIM_DELAY = { ideating: 1000, fetching: 4500, filtering: 800, assembling: 500 };

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
        await sleep(SIM_DELAY.ideating, signal);

        yield { type: "stage", stage: "fetching", partners: SIMULATED_PARTNERS };
        await sleep(SIM_DELAY.fetching, signal);
        const candidates = simulateFetch(intents, payload.budget);

        yield { type: "stage", stage: "filtering", candidateCount: candidates.length };
        await sleep(SIM_DELAY.filtering, signal);
        const kept = filterCandidates(candidates, payload.budget);

        yield { type: "stage", stage: "assembling" };
        await sleep(SIM_DELAY.assembling, signal);
        const items = assembleResults(kept, recipient_label, payload.budget);

        yield { type: "result", items, failedPartners: [] };
    } catch (error) {
        if (!signal.aborted) console.error("[pipe/recommend] failed", error);
        yield { type: "error", code: toErrorCode(error, signal) };
    }
}
