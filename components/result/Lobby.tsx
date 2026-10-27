import { chipLabel, t } from "@/i18n";
import { STAGES, type Stage } from "@/utils/pipe/events";
import { PartnerId } from "@/utils/pipe/types";
import { displayPartners, stageSentence } from "@/utils/result/waitingCopy";
import { nextStageStep, REASSURANCE_AFTER_MS } from "@/utils/result/waitingTimer";
import { WizardDraft } from "@/utils/wizard/types";
import { useEffect, useState } from "react";
import ByadetLoader from "./LobbyLoader";

interface Props {
    draft: WizardDraft;
    serverStage: number;
    categoryCount: number;
    partners: PartnerId[];
    timeoutMs: number;
    finished: boolean;

    onComplete: () => void;
}

export function Lobby({ categoryCount, draft, finished, partners, serverStage, timeoutMs, onComplete }: Props) {
    const [startedAt] = useState(() => Date.now());
    const [displayStage, setDisplayStage] = useState<number>(0);
    const [showReassurance, setShowReassurance] = useState<boolean>(false);

    useEffect(() => {
        const { delayMs, action } = nextStageStep({ displayStage, serverStage, finished });

        const timer = setTimeout(() => {
            if (action === "advance") setDisplayStage((d) => Math.min(d + 1, STAGES.length - 1));
            if (action === "complete") onComplete();
        }, delayMs);

        return () => clearTimeout(timer);
    }, [serverStage, displayStage, finished, onComplete]);

    useEffect(() => {
        const after = Math.min(REASSURANCE_AFTER_MS, timeoutMs / 2);
        const timer = setTimeout(() => setShowReassurance(true), Math.max(0, after - (Date.now() - startedAt)));
        return () => clearTimeout(timer);
    }, [timeoutMs, startedAt]);

    const stage = STAGES[displayStage];
    const progress = Math.round(((displayStage + 1) / STAGES.length) * 100);

    return (
        <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-10 text-center">
            <ByadetLoader size={160} showMessages={false} />
            <h1 className="text-2xl font-bold text-ink">{t("waiting.title")}</h1>
            <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={t("a11y.progress")}
                className="h-1.5 w-full overflow-hidden rounded-full bg-line"
            >
                <div
                    className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p key={displayStage} aria-live="polite" className="anim-rise min-h-14 leading-relaxed text-ink">
                {stageSentence(stage, { draft, categoryCount, partners })}
            </p>
            <StageVisual stage={stage} draft={draft} partners={partners} />
            {showReassurance && <p className="anim-rise text-sm text-muted">{t("waiting.reassurance")}</p>}
        </section>
    );
}

function StageVisual({ stage, draft, partners }: { stage: Stage; draft: WizardDraft; partners: PartnerId[] }) {
    if (stage === "ideating") {
        const interests = draft.interests.interests;
        if (interests.length === 0) return null;
        return (
            <ul className="flex flex-wrap justify-center gap-2">
                {interests.map((id, i) => (
                    <li
                        key={id}
                        className="anim-rise rounded-full bg-accent-soft px-3 py-1 text-sm text-accent"
                        style={{ animationDelay: `${i * 120}ms` }}
                    >
                        {chipLabel("interest", id)}
                    </li>
                ))}
            </ul>
        );
    }

    if (stage === "fetching") {
        return (
            <ul className="flex flex-wrap justify-center gap-3">
                {displayPartners(partners).map((id, i) => (
                    <li
                        key={id}
                        className="anim-pulse rounded-card border border-line bg-surface px-5 py-3 font-semibold text-ink"
                        style={{ animationDelay: `${i * 400}ms` }}
                    >
                        {t(`partners.${id}`)}
                    </li>
                ))}
            </ul>
        );
    }

    if (stage === "filtering") {
        const { dislikes, allergies, alreadyOwns } = draft.antiPrefs;
        const chips = [
            ...dislikes.map((id) => ({ key: `dislike:${id}`, label: chipLabel("dislike", id) })),
            ...allergies.map((id) => ({ key: `allergy:${id}`, label: chipLabel("allergy", id) })),
            ...alreadyOwns.map((id) => ({ key: `owns:${id}`, label: chipLabel("owns", id) })),
        ];
        if (chips.length === 0) return null;
        return (
            <ul className="flex flex-wrap justify-center gap-2">
                {chips.map(({ key, label }, i) => (
                    <li
                        key={key}
                        className="anim-rise rounded-full bg-warn-soft px-3 py-1 text-sm text-warn line-through"
                        style={{ animationDelay: `${i * 120}ms` }}
                    >
                        {label}
                    </li>
                ))}
            </ul>
        );
    }

    return null;
}
