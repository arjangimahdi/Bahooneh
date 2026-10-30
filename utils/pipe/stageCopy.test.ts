import { describe, expect, it } from "vitest";
import fa from "@/i18n/fa";
import { ERROR_CODES, STAGES } from "./events";

const stageCopy = fa.waiting.stages as Record<string, string>;
const errorCopy = fa.waiting.error as Record<string, { title?: string; body?: string }>;

describe("waiting stage copy", () => {
    it.each(STAGES)("has text for %s", (stage) => {
        expect(typeof stageCopy[stage]).toBe("string");
        expect(stageCopy[stage].trim()).not.toBe("");
    });

    it("has no text for stages that no longer exist", () => {
        const stale = Object.keys(stageCopy).filter((key) => !(STAGES as readonly string[]).includes(key));
        expect(stale).toEqual([]);
    });

    it("ideating mentions {count} and {recipient}", () => {
        expect(stageCopy.ideating).toContain("{count}");
        expect(stageCopy.ideating).toContain("{recipient}");
    });

    it("understanding has no placeholders, since no AI data exists yet", () => {
        expect(stageCopy.understanding).not.toMatch(/\{\w+\}/);
    });

    it("fetching mentions {partners}", () => {
        expect(stageCopy.fetching).toContain("{partners}");
    });
});

describe("waiting error copy", () => {
    it.each(ERROR_CODES)("has a title and body for %s", (code) => {
        expect(errorCopy[code]?.title?.trim()).toBeTruthy();
        expect(errorCopy[code]?.body?.trim()).toBeTruthy();
    });

    it("has no text for error codes that no longer exist", () => {
        const stale = Object.keys(errorCopy).filter((key) => !(ERROR_CODES as readonly string[]).includes(key));
        expect(stale).toEqual([]);
    });
});
