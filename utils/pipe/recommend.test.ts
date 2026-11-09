import { beforeEach, describe, expect, it, vi } from "vitest";
import { LLMError } from "../ai/provider";
import type { PartnerAdapter } from "../partners/types";
import type { WizardPayload } from "../wizard/schema";
import { isTerminalEvent, type RecommendEvent } from "./events";
import { recommend } from "./recommend";
import { recommendEventSchema } from "./schema";
import type { Candidate, Product } from "./types";

const getLLMOutputMock = vi.hoisted(() => vi.fn());
const curateMock = vi.hoisted(() => vi.fn());
const searchMock = vi.hoisted(() => vi.fn());

vi.mock("../ai/query", () => ({ getLLMOutput: getLLMOutputMock }));
vi.mock("../ai/curate", () => ({ curate: curateMock }));
vi.mock("../partners/shops", () => {
    const shop: PartnerAdapter = {
        id: "digikala",
        search: searchMock,
        affiliateUrl: (product) => `${product.url}?aff=1`,
    };
    return { partners: [shop], byId: new Map([[shop.id, shop]]) };
});

const payload: WizardPayload = {
    target: { ageRange: "30s", gender: null, relationship: "friend", freeText: "" },
    occasion: { occasion: "birthday", vibe: [], situation: null, preference: null, freeText: "" },
    interests: { interests: ["tech"], habits: [], footballTeam: "", freeText: "" },
    antiPrefs: { dislikes: [], allergies: [], alreadyOwns: [], freeText: "" },
    budget: { min: 1_000_000, max: 3_000_000, preset: "1mTo3m" },
};

const intents = [
    { search_term: "هدفون بی‌سیم", category_hint: "audio" },
    { search_term: "ست قهوه دمی", category_hint: "coffee" },
    { search_term: "کوله کوهنوردی", category_hint: "outdoor" },
];

const product = (id: number, price = 1_500_000): Product => ({
    id: `digikala:${id}`,
    partner: "digikala",
    title: `محصول ${id}`,
    imageUrl: null,
    price,
    url: `https://www.digikala.com/product/dkp-${id}/`,
    available: true,
});

const collect = async () => {
    const events: RecommendEvent[] = [];
    for await (const event of recommend(payload, new AbortController().signal)) events.push(event);
    return events;
};

const kindOf = (event: RecommendEvent) => (event.type === "stage" ? `stage/${event.stage}` : event.type);

beforeEach(() => {
    getLLMOutputMock.mockReset();
    curateMock.mockReset();
    searchMock.mockReset();
    getLLMOutputMock.mockResolvedValue({ recipient_label: "دوستت", intents });
    searchMock.mockImplementation(async ({ term }: { term: string }) => [
        product(intents.findIndex((i) => i.search_term === term) + 1),
    ]);
    curateMock.mockImplementation(async ({ candidates }: { candidates: Candidate[] }) =>
        candidates.map((candidate) => ({ candidate, rationale: "چون به کارش میاد." }))
    );
});

describe("recommend", () => {
    it("emits every stage in order, then one result", async () => {
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
        const events = await collect();
        for (const event of events) expect(recommendEventSchema.safeParse(event).success).toBe(true);
        expect(events.filter(isTerminalEvent)).toHaveLength(1);
        expect(isTerminalEvent(events[events.length - 1])).toBe(true);
    });

    it("reports the AI's recipient label, intent count and the shops", async () => {
        const events = await collect();
        expect(events.find((e) => e.type === "stage" && e.stage === "ideating")).toEqual({
            type: "stage",
            stage: "ideating",
            categoryCount: intents.length,
            recipientLabel: "دوستت",
        });
        expect(events.find((e) => e.type === "stage" && e.stage === "fetching")).toEqual({
            type: "stage",
            stage: "fetching",
            partners: ["digikala"],
        });
    });

    it("builds result items from the curated picks with affiliate links", async () => {
        const events = await collect();
        const result = events.at(-1);
        expect(result?.type).toBe("result");
        if (result?.type !== "result") return;
        expect(result.items).toHaveLength(3);
        expect(result.items[0].rationale).toBe("چون به کارش میاد.");
        expect(result.items[0].affiliateUrl).toBe(`${result.items[0].product.url}?aff=1`);
        expect(curateMock.mock.calls[0][0].recipientLabel).toBe("دوستت");
    });

    it("passes only hard-filtered candidates to curation", async () => {
        searchMock.mockImplementation(async () => [product(1, 10_000_000), product(2)]);
        await collect();
        const { candidates } = curateMock.mock.calls[0][0] as { candidates: Candidate[] };
        expect(candidates.map((c) => c.product.id)).toEqual(["digikala:2"]);
    });

    it("reports a shop that failed on every idea and still ends with a result", async () => {
        searchMock.mockRejectedValue(new Error("down"));
        const events = await collect();
        expect(events.map(kindOf)).toEqual([
            "stage/understanding",
            "stage/ideating",
            "stage/fetching",
            "partner_failed",
            "stage/filtering",
            "stage/assembling",
            "result",
        ]);
        expect(events.at(-1)).toMatchObject({ type: "result", failedPartners: ["digikala"] });
    });

    it("turns an AI failure into a single ai_unavailable error", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        getLLMOutputMock.mockRejectedValue(new LLMError("iranrouter error 500", "server_error"));
        const events = await collect();
        expect(events.map(kindOf)).toEqual(["stage/understanding", "error"]);
        expect(events.at(-1)).toEqual({ type: "error", code: "ai_unavailable" });
    });
});
