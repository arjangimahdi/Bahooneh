import { t } from "@/i18n";
import { ChipGroup, Textarea } from "@/components/ui";
import { ALLERGIES, DISLIKES, FREE_TEXT_MAX, FREE_TEXT_MIN, OWNS_BY_INTEREST } from "@/utils/wizard/options";
import { useStepDraft, useStepErrors, useWizardStore } from "@/utils/wizard/store";

export default function AntiPrefsStep() {
    const [antiPrefs, patch] = useStepDraft("antiPrefs");
    const errors = useStepErrors("antiPrefs");
    const interests = useWizardStore((state) => state.draft.interests.interests);
    const owns = interests.flatMap((interest) => OWNS_BY_INTEREST[interest]);

    return (
        <section className="flex flex-col gap-8">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">{t("wizard.antiPrefs.title")}</h2>
                <p className="text-muted">{t("wizard.antiPrefs.goal")}</p>
                <p className="rounded-card bg-accent-soft px-4 py-3 text-sm text-accent">{t("wizard.antiPrefs.nudge")}</p>
            </header>

            <ChipGroup
                group="dislike"
                label={t("wizard.antiPrefs.dislikes")}
                chips={DISLIKES}
                value={antiPrefs.dislikes}
                multiSelect
                onChange={(dislikes) => patch({ dislikes })}
                error={errors.dislikes && t(errors.dislikes)}
            />
            <ChipGroup
                group="allergy"
                label={t("wizard.antiPrefs.allergies")}
                chips={ALLERGIES}
                value={antiPrefs.allergies}
                multiSelect
                onChange={(allergies) => patch({ allergies })}
                error={errors.allergies && t(errors.allergies)}
            />
            {owns.length > 0 && (
                <ChipGroup
                    group="owns"
                    label={t("wizard.antiPrefs.alreadyOwns")}
                    chips={owns}
                    value={antiPrefs.alreadyOwns}
                    multiSelect
                    onChange={(alreadyOwns) => patch({ alreadyOwns })}
                    error={errors.alreadyOwns && t(errors.alreadyOwns)}
                />
            )}

            <Textarea
                value={antiPrefs.freeText}
                label={t("wizard.antiPrefs.freeText")}
                placeholder={t("wizard.antiPrefs.placeholder")}
                hint={t("common.optional")}
                error={errors.freeText && t(errors.freeText, { min: FREE_TEXT_MIN })}
                maxLength={FREE_TEXT_MAX}
                onChange={(e) => patch({ freeText: e.target.value })}
            />
        </section>
    );
}
