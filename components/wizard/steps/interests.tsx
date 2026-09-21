import { t } from "@/i18n";
import { ChipGroup, Textarea } from "@/components/ui";
import { FREE_TEXT_MAX, FREE_TEXT_MIN, INTERESTS } from "@/utils/wizard/options";
import { useStepDraft, useStepErrors } from "@/utils/wizard/store";

export default function InterestsStep() {
    const [interests, patch] = useStepDraft("interests");
    const errors = useStepErrors("interests");

    return (
        <section className="flex flex-col gap-8">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">{t("wizard.interests.title")}</h2>
                <p className="text-muted">{t("wizard.interests.goal")}</p>
            </header>

            <ChipGroup
                group="interest"
                label={t("wizard.interests.interests")}
                chips={INTERESTS}
                value={interests.interests}
                multiSelect
                onChange={(value) => patch({ interests: value })}
                error={errors.interests && t(errors.interests)}
            />

            <Textarea
                value={interests.freeText}
                label={t("wizard.interests.freeText")}
                placeholder={t("wizard.interests.placeholder")}
                hint={t("common.optional")}
                error={errors.freeText && t(errors.freeText, { min: FREE_TEXT_MIN })}
                maxLength={FREE_TEXT_MAX}
                onChange={(e) => patch({ freeText: e.target.value })}
            />
        </section>
    );
}
