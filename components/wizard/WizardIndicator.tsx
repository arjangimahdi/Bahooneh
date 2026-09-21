import { t, toPersianDigits } from "@/i18n";

interface Props {
    currentStepIndex: number;
    wizardLength: number;
}

export default function WizardIndicator({ currentStepIndex, wizardLength }: Props) {
    return (
        <div className="flex w-full flex-col gap-2">
            <p className="text-sm text-muted">
                {t("common.stepOf", {
                    current: toPersianDigits(currentStepIndex + 1),
                    total: toPersianDigits(wizardLength),
                })}
            </p>
            <ol aria-label={t("a11y.progress")} className="flex w-full items-center gap-2">
                {Array.from({ length: wizardLength }, (_, index) => (
                    <li
                        key={index}
                        aria-current={index === currentStepIndex ? "step" : undefined}
                        className={`h-2 flex-1 rounded-full transition-colors ${
                            index <= currentStepIndex ? "bg-accent" : "bg-line"
                        }`}
                    />
                ))}
            </ol>
        </div>
    );
}
