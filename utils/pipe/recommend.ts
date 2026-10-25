import { WizardPayload } from "../wizard/schema";
import { MOCK_ITEMS } from "./mock-products";
import { ErrorCode, RecommendEvent } from "./events";
import { getLLMOutput } from "../ai/query";
import { LLMError } from "../ai/provider";

const sleep = (ms: number, signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
        signal.throwIfAborted();
        const timer = setTimeout(resolve, ms);
        signal.addEventListener(
            "abort",
            () => {
                clearTimeout(timer);
                reject(signal.reason);
            },
            { once: true }
        );
    });

const toErrorCode = (error: unknown, signal: AbortSignal): ErrorCode => {
    if (signal.aborted) return "timeout";
    if (error instanceof LLMError) return "ai_unavailable";
    return "internal";
};

export async function* recommend(payload: WizardPayload, signal: AbortSignal): AsyncGenerator<RecommendEvent> {
    try {
        yield { type: "stage", stage: "understanding", recipientLabel: "friend" };
        const data = await getLLMOutput(payload, signal);
        signal.throwIfAborted();

        yield { type: "stage", stage: "ideating", categoryCount: 10 };

        await sleep(3000, signal);

        yield { type: "result", items: MOCK_ITEMS, failedPartners: [] };
    } catch (error) {
        if (!signal.aborted) console.error("[pipe/recommend] failed", error);
        yield { type: "error", code: toErrorCode(error, signal) };
    }
}
