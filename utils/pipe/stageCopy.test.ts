import { describe, expect, it } from "vitest";
import fa from "@/i18n/fa";
import { STAGES } from "./events";

const stageCopy = fa.waiting.stages as Record<string, string>;

describe("waiting stage copy", () => {
    it.each(STAGES)("has text for %s", (stage) => {
        expect(typeof stageCopy[stage]).toBe("string");
        expect(stageCopy[stage].trim()).not.toBe("");
    });

    it("has no text for stages that no longer exist", () => {
        const stale = Object.keys(stageCopy).filter((key) => !(STAGES as readonly string[]).includes(key));
        expect(stale).toEqual([]);
    });

    it("ideating mentions {count}", () => {
        expect(stageCopy.ideating).toContain("{count}");
    });

    it("fetching mentions {partners}", () => {
        expect(stageCopy.fetching).toContain("{partners}");
    });
});
