import { beforeEach, describe, expect, it, vi } from "vitest";
import { ownsForInterests } from "./options";
import { emptyDraft, useWizardStore } from "./store";
import type { WizardDraft } from "./types";

const memory = vi.hoisted(() => {
    const items = new Map<string, string>();
    globalThis.sessionStorage = {
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => void items.set(key, value),
        removeItem: (key: string) => void items.delete(key),
        clear: () => items.clear(),
        key: (index: number) => [...items.keys()][index] ?? null,
        get length() {
            return items.size;
        },
    };
    return items;
});

const store = () => useWizardStore.getState();

const validDraft: WizardDraft = {
    target: { ...emptyDraft.target, relationships: ["friend"] },
    occasion: { ...emptyDraft.occasion, occasion: "birthday" },
    interests: { ...emptyDraft.interests, interests: ["tech"] },
    antiPrefs: emptyDraft.antiPrefs,
    budget: { min: 1_000_000, max: 3_000_000, preset: "1mTo3m" },
};

const fill = (draft: WizardDraft) => {
    for (const stepId of Object.keys(draft) as (keyof WizardDraft)[]) {
        store().setStepDraft(stepId, draft[stepId]);
    }
};

beforeEach(() => {
    store().reset();
});

describe("navigation", () => {
    it("next() stays on an invalid step and records its error", () => {
        store().next();
        expect(store().currentStepIndex).toBe(0);
        expect(store().errors.target).toEqual({ step: "wizard.target.error" });
    });

    it("next() advances once the step is valid", () => {
        store().setStepDraft("target", { freeText: "همکار" });
        store().next();
        expect(store().currentStepIndex).toBe(1);
    });

    it("prev() and setStep() stay within bounds", () => {
        store().prev();
        expect(store().currentStepIndex).toBe(0);
        store().setStep(99);
        expect(store().currentStepIndex).toBe(4);
    });

    it("editing a step clears its errors", () => {
        store().next();
        store().setStepDraft("target", { gender: "male" });
        expect(store().errors.target).toEqual({});
    });
});

describe("validateAll", () => {
    it("jumps to the first invalid step and returns null", () => {
        fill({ ...validDraft, interests: emptyDraft.interests });
        store().setStep(4);
        expect(store().validateAll()).toBeNull();
        expect(store().currentStepIndex).toBe(2);
    });

    it("returns the parsed payload when everything is valid", () => {
        fill(validDraft);
        expect(store().validateAll()).toEqual(validDraft);
    });
});

describe("alreadyOwns pruning", () => {
    it("drops owned items that no longer match an interest", () => {
        store().setStepDraft("interests", { interests: ["tech", "gaming"] });
        store().setStepDraft("antiPrefs", { alreadyOwns: ["airpods", "ps5"] });
        store().setStepDraft("interests", { interests: ["tech"] });
        expect(store().draft.antiPrefs.alreadyOwns).toEqual(["airpods"]);
    });

    it("lists each owned item once", () => {
        const owns = ownsForInterests(["tech", "tech", "music"]);
        expect(owns).toEqual([...new Set(owns)]);
    });
});

describe("reset", () => {
    it("restores the empty draft, first step, and no errors", () => {
        fill(validDraft);
        store().setStep(3);
        store().next();
        store().reset();
        expect(store().draft).toEqual(emptyDraft);
        expect(store().currentStepIndex).toBe(0);
        expect(store().errors).toEqual({});
    });
});

describe("persistence", () => {
    it("saves the draft and step but not errors, and restores them", async () => {
        fill(validDraft);
        store().setStep(2);
        store().next();
        const saved = memory.get("byadet-wizard") ?? "{}";
        expect(JSON.parse(saved).state).toEqual({ draft: validDraft, currentStepIndex: 3 });

        useWizardStore.setState({ draft: emptyDraft, currentStepIndex: 0 });
        memory.set("byadet-wizard", saved);
        await useWizardStore.persist.rehydrate();
        expect(store().draft).toEqual(validDraft);
        expect(store().currentStepIndex).toBe(3);
    });
});

describe("persisted draft migration", () => {
    it("turns a v1 single relationship into relationships[]", () => {
        const { migrate } = useWizardStore.persist.getOptions();
        const v1 = {
            currentStepIndex: 1,
            draft: { ...emptyDraft, target: { ageRange: null, gender: null, relationship: "parent", freeText: "" } },
        };
        const migrated = migrate?.(v1, 1) as { draft: WizardDraft };
        expect(migrated.draft.target).toEqual({ ...emptyDraft.target, relationships: ["parent"] });
    });
});
