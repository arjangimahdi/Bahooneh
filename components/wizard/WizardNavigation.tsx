import { t } from "@/i18n";
import { Button } from "@/components/ui";

interface Props {
    currentStepIndex: number;
    wizardLength: number;
    isSubmitting?: boolean;
    next: () => void;
    back: () => void;
    submit: () => void;
}

export default function WizardNavigation({
    currentStepIndex,
    wizardLength,
    isSubmitting = false,
    next,
    back,
    submit,
}: Props) {
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === wizardLength - 1;

    return (
        <div className="flex items-center justify-between gap-3">
            <Button onClick={back} variant="secondary" disabled={isFirstStep || isSubmitting}>
                {t("common.back")}
            </Button>
            <Button onClick={isLastStep ? submit : next} variant="primary" loading={isSubmitting}>
                {t(isLastStep ? "common.submit" : "common.next")}
            </Button>
        </div>
    );
}
