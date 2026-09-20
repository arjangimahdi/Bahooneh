import { t } from "@/i18n";
import { Button } from "@/components/ui";

interface Props {
    currentStepIndex: number;
    wizardLength: number;
    next: () => void;
    back: () => void;
    submit?: () => void;
}

export default function WizardNavigation({ currentStepIndex, wizardLength, next, back }: Props) {
    const isLastStep = currentStepIndex === wizardLength - 1;

    return (
        <div className="flex flex-row justify-between items-center">
            <Button onClick={() => back()} variant="secondary">
                {t("common.back")}
            </Button>
            <Button onClick={() => next()} variant="primary">
                {t(isLastStep ? "common.submit" : "common.next")}
            </Button>
        </div>
    );
}
