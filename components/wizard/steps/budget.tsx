import { formatToman, numberToPersianWords, t } from "@/i18n";
import { ChipGroup, Input, RangeSlider } from "@/components/ui";
import { BUDGET_CEILING, BUDGET_FLOOR, BUDGET_PRESETS } from "@/utils/wizard/options";
import { useStepDraft, useStepErrors } from "@/utils/wizard/store";

const PRESET_IDS = BUDGET_PRESETS.map((preset) => preset.id);
const SLIDER_STEP = 50_000;

const amountHint = (amount: number | null) =>
    amount === null ? t("common.toman") : `${numberToPersianWords(amount)} ${t("common.toman")}`;

const parseAmount = (raw: string) => {
    const digits = raw.replace(/[^\d۰-۹]/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    return digits === "" ? null : Number(digits);
};

export default function BudgetStep() {
    const [budget, patch] = useStepDraft("budget");
    const errors = useStepErrors("budget");
    const rangeError = errors.range && t(errors.range, { floor: formatToman(BUDGET_FLOOR) });

    return (
        <section className="flex flex-col gap-8">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">{t("wizard.budget.title")}</h2>
                <p className="text-muted">{t("wizard.budget.goal")}</p>
            </header>

            <ChipGroup
                group="budget"
                label={t("wizard.budget.presets")}
                chips={PRESET_IDS}
                value={budget.preset ? [budget.preset] : []}
                onChange={([id = null]) => {
                    const preset = BUDGET_PRESETS.find((item) => item.id === id);
                    patch(preset ? { preset: preset.id, min: preset.min, max: preset.max } : { preset: null });
                }}
            />

            <div className="flex flex-col gap-4">
                <RangeSlider
                    label={t("wizard.budget.custom")}
                    value={[budget.min ?? BUDGET_FLOOR, budget.max ?? BUDGET_CEILING]}
                    onChange={([min, max]) => patch({ min, max, preset: null })}
                    min={BUDGET_FLOOR}
                    max={BUDGET_CEILING}
                    step={SLIDER_STEP}
                    thumbLabels={[t("wizard.budget.min"), t("wizard.budget.max")]}
                    formatValue={formatToman}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t("wizard.budget.min")}
                        inputMode="numeric"
                        value={budget.min === null ? "" : formatToman(budget.min)}
                        onChange={(e) => patch({ min: parseAmount(e.target.value), preset: null })}
                        hint={amountHint(budget.min)}
                        invalid={Boolean(rangeError)}
                    />
                    <Input
                        label={t("wizard.budget.max")}
                        inputMode="numeric"
                        value={budget.max === null ? "" : formatToman(budget.max)}
                        onChange={(e) => patch({ max: parseAmount(e.target.value), preset: null })}
                        hint={amountHint(budget.max)}
                        invalid={Boolean(rangeError)}
                    />
                </div>
                {rangeError && <p className="text-sm text-warn">{rangeError}</p>}
            </div>
        </section>
    );
}
