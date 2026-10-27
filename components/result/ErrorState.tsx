import { ErrorCode } from "@/utils/pipe/events";
import { useWizardStore } from "@/utils/wizard/store";
import Link from "next/link";
import { t } from "@/i18n";
import { Button } from "../ui";
import { ErrorIllustration } from "./ErrorIllustration";

export function ErrorState({ error, onRetry }: { error: ErrorCode; onRetry: () => void }) {
    const setStep = useWizardStore((s) => s.setStep);

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="gap-y-8 flex flex-col items-center">
                <ErrorIllustration />
                <h1 className="text-2xl font-bold">{t(`waiting.error.${error}.title`)}</h1>
            </div>
            <p className="leading-relaxed text-muted">{t(`waiting.error.${error}.body`)}</p>
            <div className="flex flex-row gap-x-2">
                <Button type="button" onClick={onRetry} variant="primary">
                    {t("common.retry")}
                </Button>
                <Link
                    href="/wizard"
                    onClick={() => setStep(0)}
                    className="rounded-full border border-line bg-surface px-6 py-2.5 font-semibold text-ink"
                >
                    {t("common.refine")}
                </Link>
            </div>
        </div>
    );
}
