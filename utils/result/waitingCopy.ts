import { t, toPersianDigits } from "@/i18n";
import type { Stage } from "@/utils/pipe/events";
import type { PartnerId } from "@/utils/pipe/types";
import type { WizardDraft } from "@/utils/wizard/types";

const DEFAULT_PARTNERS: readonly PartnerId[] = ["digikala"];
const MIN_CATEGORY_COUNT = 3;

export interface StageSentenceInput {
    draft: WizardDraft;
    categoryCount: number;
    partners: readonly PartnerId[];
}

export function recipientText(draft: WizardDraft): string {
    const relationship = draft.target.relationship;
    return relationship ? t(`waiting.recipient.${relationship}`) : t("waiting.recipientFallback");
}

export function categoryCountText(categoryCount: number, draft: WizardDraft): string {
    return toPersianDigits(Math.max(categoryCount, draft.interests.interests.length, MIN_CATEGORY_COUNT));
}

export function displayPartners(partners: readonly PartnerId[]): readonly PartnerId[] {
    return partners.length > 0 ? partners : DEFAULT_PARTNERS;
}

export function partnersText(partners: readonly PartnerId[]): string {
    return displayPartners(partners)
        .map((id) => t(`partners.${id}`))
        .join(" و ");
}

export function stageSentence(stage: Stage, { draft, categoryCount, partners }: StageSentenceInput): string {
    return t(`waiting.stages.${stage}`, {
        recipient: recipientText(draft),
        count: categoryCountText(categoryCount, draft),
        partners: partnersText(partners),
    });
}
