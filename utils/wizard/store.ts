import { create } from "zustand";
import { OWNS_BY_INTEREST, WIZARD_STEPS } from "./options";
import type { Interest, Owns, StepErrors, WizardDraft, WizardStepId, WizardStore } from "./types";
import { stepSchemas } from "./schema";
import type { TKey } from "@/i18n";

export const emptyDraft: WizardDraft = {
    target: {
        ageRange: null,
        gender: null,
        relationship: null,
        freeText: "",
    },
    occasion: {
        occasion: null,
        vibe: null,
        freeText: "",
    },
    interests: {
        interests: [],
        freeText: "",
    },
    antiPrefs: {
        dislikes: [],
        allergies: [],
        alreadyOwns: [],
        freeText: "",
    },
    budget: {
        min: null,
        max: null,
        preset: null,
    },
};

const LAST_STEP_INDEX = WIZARD_STEPS.length - 1;

const clampStep = (index: number) => Math.min(Math.max(index, 0), LAST_STEP_INDEX);

const pruneAlreadyOwns = (alreadyOwns: Owns[], interests: Interest[]) => {
    const allowed = new Set(interests.flatMap((interest) => OWNS_BY_INTEREST[interest]));
    return alreadyOwns.filter((id) => allowed.has(id));
};

const getStepErrors = (draft: WizardDraft, stepId: WizardStepId): StepErrors => {
    const schema = stepSchemas[stepId];
    if (!schema) return {};
    const result = schema.safeParse(draft[stepId]);
    if (result.success) return {};
    return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message as TKey]));
};

export const useWizardStore = create<WizardStore>()((set, get) => ({
    currentStepIndex: 0,
    draft: emptyDraft,
    errors: {},

    setStep: (stepIndex) => set({ currentStepIndex: clampStep(stepIndex) }),

    validateStep: (stepId) => {
        const stepErrors = getStepErrors(get().draft, stepId);
        set((state) => ({ errors: { ...state.errors, [stepId]: stepErrors } }));
        return Object.keys(stepErrors).length === 0;
    },

    next: () => {
        const { currentStepIndex, validateStep } = get();
        if (!validateStep(WIZARD_STEPS[currentStepIndex])) return;
        set({ currentStepIndex: clampStep(currentStepIndex + 1) });
    },

    prev: () => set((state) => ({ currentStepIndex: clampStep(state.currentStepIndex - 1) })),

    reset: () => set({ currentStepIndex: 0, draft: emptyDraft, errors: {} }),

    setStepDraft: (stepId, stepDraft) =>
        set((state) => {
            const draft: WizardDraft = {
                ...state.draft,
                [stepId]: { ...state.draft[stepId], ...stepDraft },
            };

            if (stepId === "interests") {
                draft.antiPrefs = {
                    ...draft.antiPrefs,
                    alreadyOwns: pruneAlreadyOwns(draft.antiPrefs.alreadyOwns, draft.interests.interests),
                };
            }

            return { draft, errors: { ...state.errors, [stepId]: {} } };
        }),
}));

export const useCurrentStepId = () => useWizardStore((state) => WIZARD_STEPS[state.currentStepIndex]);

export const useStepDraft = <S extends WizardStepId>(stepId: S) => {
    const draft = useWizardStore((state) => state.draft[stepId]);
    const setStepDraft = useWizardStore((state) => state.setStepDraft);
    const patch = (stepDraft: Partial<WizardDraft[S]>) => setStepDraft(stepId, stepDraft);
    return [draft, patch] as const;
};

const NO_ERRORS: StepErrors = {};

export const useStepErrors = (stepId: WizardStepId) =>
    useWizardStore((state) => state.errors[stepId] ?? NO_ERRORS);
