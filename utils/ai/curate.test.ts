import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Candidate } from "../pipe/types";
import type { WizardPayload } from "../wizard/schema";
import { cleanPicks, curate, fallbackPicks, MAX_PICKS, preparePool, takeTurns } from "./curate";
import { LLMError } from "./provider";

const generateMock = vi.hoisted(() => vi.fn());

vi.mock("./client", () => ({
    llm: () => ({ id: "fake", generate: generateMock }),
}));

const payload: WizardPayload = {
    target: { ageRange: "30s", gender: null, relationship: "friend", freeText: "" },
    occasion: { occasion: "birthday", vibe: [], situation: null, preference: null, freeText: "" },
    interests: { interests: ["music"], habits: [], footballTeam: "", freeText: "عاشق قهوه است" },
    antiPrefs: { dislikes: [], allergies: [], alreadyOwns: [], freeText: "" },
    budget: { min: 500_000, max: 1_500_000, preset: null },
};

let nextId = 0;
const candidate = (idea: string, title = `${idea} ${nextId}`, extra: Partial<Candidate["product"]> = {}): Candidate => {
    nextId += 1;
    return {
        intent: { search_term: idea, category_hint: idea },
        product: {
            id: `digikala:${nextId}`,
            partner: "digikala",
            title,
            imageUrl: null,
            price: 700_000,
            url: `https://www.digikala.com/product/dkp-${nextId}/`,
            available: true,
            ...extra,
        },
    };
};

const many = (idea: string, count: number) => Array.from({ length: count }, () => candidate(idea));

const run = (candidates: Candidate[], signal = new AbortController().signal, timeoutMs?: number) =>
    curate({ payload, candidates, recipientLabel: "دوستت", signal, timeoutMs });

beforeEach(() => {
    generateMock.mockReset();
    nextId = 0;
});

describe("takeTurns", () => {
    it("takes one candidate per idea per round, keeping the order inside each idea", () => {
        const [h1, h2, h3] = many("headphones", 3);
        const [c1] = many("coffee", 1);
        const [b1, b2] = many("books", 2);
        expect(takeTurns([h1, h2, h3, c1, b1, b2], 5, 24)).toEqual([h1, c1, b1, h2, b2, h3]);
    });

    it("respects the per-idea and total limits", () => {
        const list = [...many("headphones", 8), ...many("coffee", 8)];
        const picked = takeTurns(list, 3, 5);
        expect(picked).toHaveLength(5);
        expect(picked.filter((c) => c.intent.search_term === "headphones").length).toBeLessThanOrEqual(3);
        expect(takeTurns(list, 3, 24)).toHaveLength(6);
    });
});

describe("preparePool", () => {
    it("caps the pool and numbers one line per candidate without urls", () => {
        const list = ["a", "b", "c", "d", "e", "f"].flatMap((idea) => many(idea, 7));
        const { pool, text } = preparePool(list);
        expect(pool).toHaveLength(24);
        const lines = text.split("\n");
        expect(lines).toHaveLength(24);
        expect(lines[0].startsWith("1 | ")).toBe(true);
        expect(lines[23].startsWith("24 | ")).toBe(true);
        expect(text).not.toContain("http");
    });

    it("adds the rating only when known, and shortens long titles", () => {
        const rated = candidate("coffee", "ست قهوه", { rating: 84.52, reviewCount: 5374 });
        const long = candidate("books", "ک".repeat(120));
        const { text } = preparePool([rated, long]);
        const [first, second] = text.split("\n");
        expect(first).toBe("1 | ست قهوه | 700000 تومان | امتیاز 85 از 100 (5374 نظر) | ایده: coffee");
        expect(second).not.toContain("امتیاز");
        expect(second).toContain("…");
    });
});

describe("cleanPicks", () => {
    it("drops unknown and repeated refs, trims and caps the list", () => {
        const pool = many("x", 10);
        const picks = cleanPicks(
            [2, 2, 31, 0, 5, 9, 1, 3, 4, 6, 7].map((ref) => ({ ref, rationale: `  دلیل ${ref}  ` })),
            pool
        );
        expect(picks.map((p) => p.candidate)).toEqual([pool[1], pool[4], pool[8], pool[0], pool[2], pool[3]]);
        expect(picks[0].rationale).toBe("دلیل 2");
        expect(picks).toHaveLength(MAX_PICKS);
    });

    it("shortens a very long rationale", () => {
        const pool = many("x", 1);
        const [pick] = cleanPicks([{ ref: 1, rationale: "و".repeat(500) }], pool);
        expect(pick.rationale.length).toBeLessThanOrEqual(201);
    });
});

describe("curate", () => {
    it("returns [] without calling the AI when there are no candidates", async () => {
        expect(await run([])).toEqual([]);
        expect(generateMock).not.toHaveBeenCalled();
    });

    it("maps the AI's numbers back to candidates with their rationale", async () => {
        const list = [...many("headphones", 2), ...many("coffee", 2)];
        const { pool } = preparePool(list);
        generateMock.mockResolvedValue({
            picks: [
                { ref: 2, rationale: "برای دوستت که عاشق قهوه‌ست." },
                { ref: 1, rationale: "یه هدفون خوب برای موزیک." },
            ],
        });
        const picks = await run(list);
        expect(picks).toEqual([
            { candidate: pool[1], rationale: "برای دوستت که عاشق قهوه‌ست." },
            { candidate: pool[0], rationale: "یه هدفون خوب برای موزیک." },
        ]);
        const { user } = generateMock.mock.calls[0][0];
        expect(user).toContain("دوستت");
        expect(user).toContain("1 | ");
    });

    it("falls back to taking turns between ideas when the AI fails", async () => {
        const list = [...many("headphones", 3), ...many("coffee", 1), ...many("books", 3)];
        generateMock.mockRejectedValue(new LLMError("down", "server_error"));
        const picks = await run(list);
        expect(picks).toEqual(fallbackPicks(list));
        expect(picks.map((p) => p.candidate.intent.search_term).slice(0, 3)).toEqual(["headphones", "coffee", "books"]);
        expect(picks.every((p) => p.rationale === "")).toBe(true);
    });

    it("falls back when the answer has no usable picks", async () => {
        const list = many("headphones", 3);
        generateMock.mockResolvedValue({ picks: [{ ref: 99, rationale: "x" }] });
        expect(await run(list)).toEqual(fallbackPicks(list));
    });

    it("falls back when the AI is slower than the limit", async () => {
        const list = many("headphones", 3);
        generateMock.mockImplementation(
            ({ signal }: { signal: AbortSignal }) =>
                new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)))
        );
        expect(await run(list, new AbortController().signal, 20)).toEqual(fallbackPicks(list));
    });

    it("throws the cancel when the request itself is aborted", async () => {
        const controller = new AbortController();
        const list = many("headphones", 3);
        generateMock.mockImplementation(
            ({ signal }: { signal: AbortSignal }) =>
                new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)))
        );
        const pending = run(list, controller.signal);
        controller.abort(new Error("client left"));
        await expect(pending).rejects.toThrow("client left");
    });

    it("rethrows unexpected errors instead of hiding them", async () => {
        generateMock.mockRejectedValue(new TypeError("bug"));
        await expect(run(many("headphones", 2))).rejects.toThrow("bug");
    });
});
