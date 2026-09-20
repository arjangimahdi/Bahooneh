import type {
    AGE_RANGES,
    ALLERGIES,
    BUDGET_PRESETS,
    DISLIKES,
    GENDERS,
    INTERESTS,
    OCCASIONS,
    OWNS,
    RELATIONSHIPS,
    VIBES,
    WIZARD_STEPS,
} from "./options";

export type AgeRange = (typeof AGE_RANGES)[number];
export type Gender = (typeof GENDERS)[number];
export type Relationship = (typeof RELATIONSHIPS)[number];
export type Occasion = (typeof OCCASIONS)[number];
export type Vibe = (typeof VIBES)[number];
export type Interest = (typeof INTERESTS)[number];
export type Dislike = (typeof DISLIKES)[number];
export type Allergy = (typeof ALLERGIES)[number];
export type Owns = (typeof OWNS)[number];
export type BudgetPresetId = (typeof BUDGET_PRESETS)[number]["id"];

export type WizardStepId = (typeof WIZARD_STEPS)[number];

export interface TargetDraft {
    ageRange: AgeRange | null;
    gender: Gender | null;
    relationship: Relationship | null;
    freeText: string;
}

export interface OccasionDraft {
    occasion: Occasion | null;
    vibe: Vibe | null;
    freeText: string;
}

export interface InterestsDraft {
    interests: Interest[];
    freeText: string;
}

export interface AntiPrefsDraft {
    dislikes: Dislike[];
    allergies: Allergy[];
    alreadyOwns: Owns[];
    freeText: string;
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
