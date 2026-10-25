import { describe, expect, it } from "vitest";
import { ERROR_CODES, STAGES, encodeEvent, isTerminalEvent, type RecommendEvent } from "./events";
import { MOCK_ITEMS } from "./mock-products";
import { parseEvent } from "./schema";

const SAMPLES: RecommendEvent[] = [
    { type: "start", timeoutMs: 25_000 },
    { type: "stage", stage: "understanding", recipientLabel: "دوستت" },
    { type: "stage", stage: "ideating", categoryCount: 4 },
    { type: "stage", stage: "fetching", partners: ["digikala", "snapshop"] },
    { type: "stage", stage: "filtering", candidateCount: 37 },
    { type: "stage", stage: "assembling" },
    { type: "partner_failed", partner: "snapshop" },
    { type: "result", items: MOCK_ITEMS, failedPartners: [] },
    { type: "error", code: "timeout" },
];

const kindOf = (event: RecommendEvent) => (event.type === "stage" ? `stage/${event.stage}` : event.type);

const product = MOCK_ITEMS[0].product;
const resultLine = (overrides: Record<string, unknown>) =>
    JSON.stringify({
        type: "result",
        items: [{ ...MOCK_ITEMS[0], product: { ...product, ...overrides } }],
        failedPartners: [],
    });

describe("round trip", () => {
    it.each(SAMPLES.map((sample) => [kindOf(sample), sample] as const))("%s survives encode and parse", (_, sample) => {
        expect(parseEvent(encodeEvent(sample))).toEqual(sample);
    });

    it.each(SAMPLES.map((sample) => [kindOf(sample), sample] as const))(
        "%s encodes to one newline-terminated line",
        (_, sample) => {
            const line = encodeEvent(sample);
            expect(line.endsWith("\n")).toBe(true);
            expect(line.endsWith(" \n")).toBe(false);
            expect(line.indexOf("\n")).toBe(line.length - 1);
        }
    );
});

describe("garbage is rejected", () => {
    it.each([
        "",
        "   ",
        "not json",
        '{"type":"sta',
        "[]",
        "null",
        '"hello"',
        '{"type":"nope"}',
        '{"type":"stage"}',
        '{"type":"stage","stage":"understanding"}',
        '{"type":"stage","stage":"fetching"}',
        '{"type":"stage","stage":"fetching","partners":["amazon"]}',
        '{"type":"start","timeoutMs":-5}',
    ])("parseEvent(%j) is null", (line) => {
        expect(parseEvent(line)).toBeNull();
    });
});

describe("nothing forgotten", () => {
    it("SAMPLES cover every stage in STAGES order", () => {
        const stages = SAMPLES.flatMap((sample) => (sample.type === "stage" ? [sample.stage] : []));
        expect(stages).toEqual([...STAGES]);
    });

    it.each(ERROR_CODES)("error code %s round-trips", (code) => {
        const event: RecommendEvent = { type: "error", code };
        expect(parseEvent(encodeEvent(event))).toEqual(event);
    });
});

describe("isTerminalEvent", () => {
    const expected: Record<string, boolean> = {
        start: false,
        "stage/understanding": false,
        "stage/ideating": false,
        "stage/fetching": false,
        "stage/filtering": false,
        "stage/assembling": false,
        partner_failed: false,
        result: true,
        error: true,
    };

    it.each(SAMPLES.map((sample) => [kindOf(sample), sample] as const))("%s", (kind, sample) => {
        expect(isTerminalEvent(sample)).toBe(expected[kind]);
    });
});

describe("product rules", () => {
    it("accepts a product without an image", () => {
        expect(parseEvent(resultLine({ imageUrl: null }))).not.toBeNull();
    });

    it("rejects the whole line when a product url is invalid", () => {
        expect(parseEvent(resultLine({ url: "not a url" }))).toBeNull();
    });

    it("accepts a product without a category", () => {
        const line = resultLine({});
        expect(JSON.parse(line).items[0].product).not.toHaveProperty("category");
        expect(parseEvent(line)).not.toBeNull();
    });
});
