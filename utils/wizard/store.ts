import { create } from "zustand";
import { OWNS_BY_INTEREST, WIZARD_STEPS } from "./options";
import type {
    AGE_RANGES,
    ALLERGIES,
    BUDGET_PRESETS,
    DISLIKES,
    GENDERS,
    INTERESTS,
    OCCASIONS,
    RELATIONSHIPS,
    VIBES,
} from "./options";

export type AgeRange = (typeof AGE_RANGES)[number];
export type Gender = (typeof GENDERS)[number];
export type Relationship = (typeof RELATIONSHIPS)[number];
export type Occasion = (typeof OCCASIONS)[number];
export type Vibe = (typeof VIBES)[number];
export type Interest = (typeof INTERESTS)[number];
export type Dislike = (typeof DISLIKES)[number];
export type Allergy = (typeof ALLERGIES)[number];
export type BudgetPresetId = (typeof BUDGET_PRESETS)[number]["id"];

export type WizardStepId = (typeof WIZARD_STEPS)[number];

export interface TargetDraft {
    ageRange: AgeRange | null;
    gender: Gender | null;
    relationship: Relationship | null;
    freeText?: string;
}

export interface OccasionDraft {
    occasion: Occasion | null;
    vibe: Vibe | null;
    freeText?: string;
}

export interface InterestsDraft {
    interests: Interest[];
    freeText?: string;
}

export interface AntiPrefsDraft {
    dislikes: Dislike[];
    allergies: Allergy[];
    alreadyOwns: string[];
    freeText?: string;
}

export interface BudgetDraft {
    min: number | null;
    max: number | null;
    preset: BudgetPresetId | null;
}

export interface WizardDraft {
    target: TargetDraft;
    occasion: OccasionDraft;
    interests: InterestsDraft;
    antiPrefs: AntiPrefsDraft;
    budget: BudgetDraft;
}

export interface WizardState {
    currentStepIndex: number;
    draft: WizardDraft;
}

export interface WizardActions {
    setStep: (stepIndex: number) => void;
    next: () => void;
    prev: () => void;
    reset: () => void;
    setStepDraft: <S extends WizardStepId>(stepId: S, stepDraft: Partial<WizardDraft[S]>) => void;
}

export type WizardStore = WizardState & WizardActions;

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

const pruneAlreadyOwns = (alreadyOwns: string[], interests: Interest[]) => {
    const allowed = new Set(interests.flatMap((interest) => OWNS_BY_INTEREST[interest]));
    return alreadyOwns.filter((id) => allowed.has(id));
};

export const useWizardStore = create<WizardStore>()((set) => ({
    currentStepIndex: 0,
    draft: emptyDraft,

    setStep: (stepIndex) => set({ currentStepIndex: clampStep(stepIndex) }),

    next: () => set((state) => ({ currentStepIndex: clampStep(state.currentStepIndex + 1) })),

    prev: () => set((state) => ({ currentStepIndex: clampStep(state.currentStepIndex - 1) })),

    reset: () => set({ currentStepIndex: 0, draft: emptyDraft }),

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

            return { draft };
        }),
}));

export const useCurrentStepId = () => useWizardStore((state) => WIZARD_STEPS[state.currentStepIndex]);