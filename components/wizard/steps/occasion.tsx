import { t } from "@/i18n";
import { ChipGroup, Textarea } from "@/components/ui";
import { FREE_TEXT_MAX, FREE_TEXT_MIN, OCCASIONS, VIBES } from "@/utils/wizard/options";
import { useStepDraft, useStepErrors } from "@/utils/wizard/store";

export default function OccasionStep() {
    const [occasion, patch] = useStepDraft("occasion");
    const errors = useStepErrors("occasion");

    return (
        <section className="flex flex-col gap-8">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">{t("wizard.occasion.title")}</h2>
                <p className="text-muted">{t("wizard.occasion.goal")}</p>
            </header>

            <ChipGroup
                group="occasion"
                label={t("wizard.occasion.occasion")}
                chips={OCCASIONS}
                value={occasion.occasion ? [occasion.occasion] : []}
                onChange={([value = null]) => patch({ occasion: value })}
                error={errors.occasion && t(errors.occasion)}
            />
            <ChipGroup
                group="vibe"
                label={t("wizard.occasion.vibe")}
                hint={t("common.optional")}
                chips={VIBES}
                value={occasion.vibe}
                multiSelect
                onChange={(vibe) => patch({ vibe })}
                error={errors.vibe && t(errors.vibe)}
            />

            <Textarea
                value={occasion.freeText}
                label={t("wizard.occasion.freeText")}
                placeholder={t("wizard.occasion.placeholder")}
                hint={t("common.optional")}
                error={errors.freeText && t(errors.freeText, { min: FREE_TEXT_MIN })}
                maxLength={FREE_TEXT_MAX}
                onChange={(e) => patch({ freeText: e.target.value })}
            />
        </section>
    );
}
