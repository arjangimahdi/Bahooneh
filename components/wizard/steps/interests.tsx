import { t } from "@/i18n";
import { ChipGroup, Textarea } from "@/components/ui";
import { FREE_TEXT_MAX, INTERESTS } from "@/utils/wizard/options";
import { useStepDraft, useStepErrors } from "@/utils/wizard/store";

export default function InterestsStep() {
    const [interests, patch] = useStepDraft("interests");
    const errors = useStepErrors("interests");
    const count = interests.interests.length;
    const countHint = count === 1 ? "wizard.interests.fewHint" : count > 5 ? "wizard.interests.manyHint" : null;

    return (
        <section className="flex flex-col gap-8">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">{t("wizard.interests.title")}</h2>
                <p className="text-muted">{t("wizard.interests.goal")}</p>
            </header>

            <div className="flex flex-col gap-3">
                <ChipGroup
                    group="interest"
                    label={t("wizard.interests.interests")}
                    chips={INTERESTS}
                    value={interests.interests}
                    multiSelect
                    onChange={(value) => patch({ interests: value })}
                    error={errors.interests && t(errors.interests)}
                />
                {countHint && <p className="text-sm text-muted">{t(countHint)}</p>}
            </div>

            <Textarea
                value={interests.freeText}
                label={t("wizard.interests.freeText")}
                placeholder={t("wizard.interests.placeholder")}
                hint={t("common.optional")}
                error={errors.freeText && t(errors.freeText)}
                maxLength={FREE_TEXT_MAX}
                onChange={(e) => patch({ freeText: e.target.value })}
            />
        </section>
    );
}
