"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useCurrentStepId, useWizardStore } from "@/utils/wizard/store";
import type { WizardStepId } from "@/utils/wizard/types";
import { WIZARD_STEPS } from "@/utils/wizard/options";
import TargetStep from "./steps/target";
import OccasionStep from "./steps/occasion";
import InterestsStep from "./steps/interests";
import AntiPrefsStep from "./steps/antiPrefs";
import BudgetStep from "./steps/budget";
import WizardIndicator from "./WizardIndicator";
import WizardNavigation from "./WizardNavigation";
import { useRouter } from "next/navigation";

const STEP_COMPONENTS: Record<WizardStepId, ComponentType> = {
    target: TargetStep,
    occasion: OccasionStep,
    interests: InterestsStep,
    antiPrefs: AntiPrefsStep,
    budget: BudgetStep,
};

const WIZARD_LENGTH = WIZARD_STEPS.length;

export default function WizardShell() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentStepIndex = useWizardStore((state) => state.currentStepIndex);
    const next = useWizardStore((state) => state.next);
    const prev = useWizardStore((state) => state.prev);
    const validateAll = useWizardStore((state) => state.validateAll);
    const currentStepId = useCurrentStepId();
    const Step = STEP_COMPONENTS[currentStepId];
    const stepRef = useRef<HTMLDivElement>(null);
    const shownStepIndex = useRef(currentStepIndex);

    useEffect(() => {
        if (shownStepIndex.current === currentStepIndex) return;
        shownStepIndex.current = currentStepIndex;
        const heading = stepRef.current?.querySelector("h2");
        if (!heading) return;
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        window.scrollTo({ top: 0 });
    }, [currentStepIndex]);

    const submit = () => {
        if (isSubmitting) return;
        if (!validateAll()) return;
        setIsSubmitting(true);
        router.push("/result");
    };

    return (
        <div className="flex flex-col gap-8">
            <WizardIndicator currentStepIndex={currentStepIndex} wizardLength={WIZARD_LENGTH} />
            <div ref={stepRef}>
                <Step key={currentStepId} />
            </div>
            <WizardNavigation
                currentStepIndex={currentStepIndex}
                wizardLength={WIZARD_LENGTH}
                isSubmitting={isSubmitting}
                next={next}
                back={prev}
                submit={submit}
            />
        </div>
    );
}
