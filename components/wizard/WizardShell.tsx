"use client";

import type { ComponentType } from "react";
import { useCurrentStepId, useWizardStore, type WizardStepId } from "@/utils/wizard/store";
import TargetStep from "./steps/target";
import OccasionStep from "./steps/occasion";
import InterestsStep from "./steps/interests";
import AntiPrefsStep from "./steps/antiPrefs";
import BudgetStep from "./steps/budget";
import WizardIndicator from "./WizardIndicator";
import { WIZARD_STEPS } from "@/utils/wizard/options";
import WizardNavigation from "./WizardNavigation";

const STEP_COMPONENTS: Record<WizardStepId, ComponentType> = {
    target: TargetStep,
    occasion: OccasionStep,
    interests: InterestsStep,
    antiPrefs: AntiPrefsStep,
    budget: BudgetStep,
};

const WIZARD_LENGTH = WIZARD_STEPS.length;

export default function WizardShell() {
    const currentStepIndex = useWizardStore((state) => state.currentStepIndex);
    const next = useWizardStore((state) => state.next);
    const prev = useWizardStore((state) => state.prev);
    const currentStepId = useCurrentStepId();
    const Step = STEP_COMPONENTS[currentStepId];

    return (
        <div className="">
            <WizardIndicator currentStepIndex={currentStepIndex} wizardLength={WIZARD_LENGTH} />
            <div className="">
                <Step key={currentStepId} />
            </div>
            <WizardNavigation
                currentStepIndex={currentStepIndex}
                wizardLength={WIZARD_LENGTH}
                next={next}
                back={prev}
            />
        </div>
    );
}
