import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LLMError } from "../ai/provider";
import type { WizardPayload } from "../wizard/schema";
import { isTerminalEvent, type RecommendEvent } from "./events";
import { recommend } from "./recommend";
import { recommendEventSchema } from "./schema";

const getLLMOutputMock = vi.hoisted(() => vi.fn());

vi.mock("../ai/query", () => ({ getLLMOutput: getLLMOutputMock }));

const payload: WizardPayload = {
    target: { ageRange: "30s", gender: null, relationship: "friend", freeText: "" },
    occasion: { occasion: "birthday", vibe: [], freeText: "" },
    interests: { interests: ["tech"], freeText: "" },
    antiPrefs: { dislikes: [], allergies: [], alreadyOwns: [], freeText: "" },
    budget: { min: 1_000_000, max: 3_000_000, preset: "1mTo3m" },
};

const intents = [
    { search_term: "هدفون بی‌سیم", category_hint: "audio" },
    { search_term: "ست قهوه دمی", category_hint: "coffee" },
    { search_term: "کوله کوهنوردی", category_hint: "outdoor" },
];

const collect = async () => {
    const events: RecommendEvent[] = [];
    const run = (async () => {
        for await (const event of recommend(payload, new AbortController().signal)) events.push(event);
    })();
    await vi.runAllTimersAsync();
    await run;
    return events;
};

const kindOf = (event: RecommendEvent) => (event.type === "stage" ? `stage/${event.stage}` : event.type);

beforeEach(() => {
    vi.useFakeTimers();
    getLLMOutputMock.mockReset();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("recommend (simulated)", () => {
    it("emits every stage in order, then one result", async () => {
        getLLMOutputMock.mockResolvedValue({ recipient_label: "دوستت", intents });
        const events = await collect();
        expect(events.map(kindOf)).toEqual([
            "stage/understanding",
            "stage/ideating",
            "stage/fetching",
            "stage/filtering",
            "stage/assembling",
            "result",
        ]);
    });

    it("emits only valid events and exactly one terminal event, last", async () => {
        getLLMOutputMock.mockResolvedValue({ recipient_label: "دوستت", intents });
        const events = await collect();
        for (const event of events) expect(recommendEventSchema.safeParse(event).success).toBe(true);
        expect(events.filter(isTerminalEvent)).toHaveLength(1);
        expect(isTerminalEvent(events[events.length - 1])).toBe(true);
    });

    it("reports the AI's recipient label and intent count, and in-budget items", async () => {
        getLLMOutputMock.mockResolvedValue({ recipient_label: "همکارت", intents });
        const events = await collect();
        expect(events.find((e) => e.type === "stage" && e.stage === "understanding")).toEqual({
            type: "stage",
            stage: "understanding",
        });
        expect(events.find((e) => e.type === "stage" && e.stage === "ideating")).toEqual({
            type: "stage",
            stage: "ideating",
            categoryCount: intents.length,
            recipientLabel: "همکارت",
        });
        const result = events.at(-1);
        expect(result?.type).toBe("result");
        if (result?.type !== "result") return;
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.failedPartners).toEqual([]);
        for (const { product } of result.items) {
            expect(product.price).toBeGreaterThanOrEqual(1_000_000);
            expect(product.price).toBeLessThanOrEqual(3_000_000);
        }
    });

    it("turns an AI failure into a single ai_unavailable error", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        getLLMOutputMock.mockRejectedValue(new LLMError("iranrouter error 500", "server_error"));
        const events = await collect();
        expect(events.map(kindOf)).toEqual(["stage/understanding", "error"]);
        expect(events.at(-1)).toEqual({ type: "error", code: "ai_unavailable" });
    });
});
