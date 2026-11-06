import { describe, expect, it } from "vitest";
import { normaliseText, toWords } from "./normalise";

describe("normaliseText", () => {
    it("replaces Arabic letters with their Persian forms", () => {
        expect(normaliseText("كيف")).toBe("کیف");
    });

    it("turns a half-space into a space", () => {
        expect(normaliseText("پلی‌استیشن")).toBe("پلی استیشن");
    });

    it("turns punctuation into spaces", () => {
        expect(normaliseText("کنترلر-بازی/کنسول (مشکی)، جدید")).toBe("کنترلر بازی کنسول مشکی جدید");
    });

    it("collapses extra spaces and trims", () => {
        expect(normaliseText("  عطر    مردانه  ")).toBe("عطر مردانه");
    });

    it("lowercases capitals", () => {
        expect(normaliseText("Sony PS5")).toBe("sony ps5");
    });

    it("keeps Latin and Persian digits", () => {
        expect(normaliseText("PS5 پلی استیشن ۵")).toBe("ps5 پلی استیشن ۵");
    });
});

describe("toWords", () => {
    it("splits normalised text into words", () => {
        expect(toWords("ساعت‌هوشمند (شیائومی)")).toEqual(["ساعت", "هوشمند", "شیائومی"]);
    });

    it("returns no words for empty text", () => {
        expect(toWords("")).toEqual([]);
    });

    it("returns no words for text with only punctuation", () => {
        expect(toWords(" - / ، ")).toEqual([]);
    });
});
