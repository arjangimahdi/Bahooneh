import { t } from "@/i18n";
import { ChipGroup, Textarea } from "@/components/ui";
import { AGE_RANGES, FREE_TEXT_MAX, FREE_TEXT_MIN, GENDERS, RELATIONSHIPS } from "@/utils/wizard/options";
import { useStepDraft, useStepErrors } from "@/utils/wizard/store";

export default function TargetStep() {
    const [target, patch] = useStepDraft("target");
    const errors = useStepErrors("target");

    return (
        <section className="flex flex-col gap-8">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">{t("wizard.target.title")}</h2>
                <p className="text-muted">{t("wizard.target.goal")}</p>
            </header>

            <ChipGroup
                group="ageRange"
                label={t("wizard.target.ageRange")}
                chips={AGE_RANGES}
                value={target.ageRange ? [target.ageRange] : []}
                onChange={([ageRange = null]) => patch({ ageRange })}
                error={errors.ageRange && t(errors.ageRange)}
            />
            <ChipGroup
                group="gender"
                label={t("wizard.target.gender")}
                chips={GENDERS}
                value={target.gender ? [target.gender] : []}
                onChange={([gender = null]) => patch({ gender })}
                error={errors.gender && t(errors.gender)}
            />
            <ChipGroup
                group="relationship"
                label={t("wizard.target.relationship")}
                chips={RELATIONSHIPS}
                value={target.relationship ? [target.relationship] : []}
                onChange={([relationship = null]) => patch({ relationship })}
                error={errors.relationship && t(errors.relationship)}
            />

            <Textarea
                value={target.freeText}
                label={t("wizard.target.freeText")}
                placeholder={t("wizard.target.placeholder")}
                hint={t("common.optional")}
                error={errors.freeText && t(errors.freeText, { min: FREE_TEXT_MIN })}
                maxLength={FREE_TEXT_MAX}
                onChange={(e) => patch({ freeText: e.target.value })}
            />
        </section>
    );
}
