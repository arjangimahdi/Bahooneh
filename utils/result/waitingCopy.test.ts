import { describe, expect, it } from "vitest";
import fa from "@/i18n/fa";
import { STAGES } from "@/utils/pipe/events";
import { emptyDraft } from "@/utils/wizard/store";
import type { WizardDraft } from "@/utils/wizard/types";
import { categoryCountText, partnersText, recipientText, stageSentence } from "./waitingCopy";

const draft: WizardDraft = {
    ...emptyDraft,
    target: { ...emptyDraft.target, relationship: "colleague" },
    interests: { ...emptyDraft.interests, interests: ["tech", "music", "travel", "art"] },
};

describe("recipientText", () => {
    it("uses the relationship's recipient copy", () => {
        expect(recipientText(draft)).toBe(fa.waiting.recipient.colleague);
    });

    it("falls back when no relationship is chosen", () => {
        expect(recipientText(emptyDraft)).toBe(fa.waiting.recipientFallback);
    });
});

describe("categoryCountText", () => {
    it("uses the AI count when it is the largest", () => {
        expect(categoryCountText(7, draft)).toBe("۷");
    });

    it("uses the interest count when it is the largest", () => {
        expect(categoryCountText(2, draft)).toBe("۴");
    });

    it("never goes below 3", () => {
        expect(categoryCountText(0, emptyDraft)).toBe("۳");
    });
});

describe("partnersText", () => {
    it("shows Digikala when no partners are known yet", () => {
        expect(partnersText([])).toBe(fa.partners.digikala);
    });

    it("joins two partners with و", () => {
        expect(partnersText(["digikala", "snapshop"])).toBe(`${fa.partners.digikala} و ${fa.partners.snapshop}`);
    });
});

describe("stageSentence", () => {
    it.each(STAGES)("fills every placeholder for %s", (stage) => {
        const sentence = stageSentence(stage, { draft: emptyDraft, categoryCount: 0, partners: [] });
        expect(sentence).not.toContain("{");
        expect(sentence.trim()).not.toBe("");
    });
});
