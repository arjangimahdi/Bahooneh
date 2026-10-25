import { StructuredLLM } from "./provider";
import { createIranRouter } from "./providers/iranrouter";

let instance: StructuredLLM | null = null;

export function llm(): StructuredLLM {
    if (instance) return instance;

    const provider = process.env.AI_PROVIDER;

    if (provider === "iranrouter") {
        instance = createIranRouter();
    }

    if (!instance) {
        throw new Error(`Unknown AI_PROVIDER "${provider}" (expected "iranrouter")`);
    }

    return instance;
}
