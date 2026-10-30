"use client";

import { ErrorState } from "@/components/result/ErrorState";
import { Lobby } from "@/components/result/Lobby";
import { ProductsView } from "@/components/result/ProductsView";
import { useRecommend } from "@/hooks/useRecommend";
import { WizardPayload, wizardSchema } from "@/utils/wizard/schema";
import { useWizardStore } from "@/utils/wizard/store";
import { WizardDraft } from "@/utils/wizard/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const draftToPayload = (draft: WizardDraft): WizardPayload | null => {
    const result = wizardSchema.safeParse(draft);
    return result.success ? result.data : null;
};

export default function Page() {
    const [waitDone, setWaitDone] = useState<boolean>(false);

    const router = useRouter();
    const draft = useWizardStore((state) => state.draft);

    const payload = useMemo(() => draftToPayload(draft), [draft]);

    const { timeoutMs, categoryCount, partners, failedPartners, serverStage, results, error, retry } =
        useRecommend(payload);

    const onComplete = useCallback(() => {
        setWaitDone(true);
    }, []);
    const onRetry = useCallback(() => {
        setWaitDone(false);
        retry();
    }, [retry]);

    useEffect(() => {
        if (!payload) router.replace("/wizard");
    }, [router, payload]);

    if (waitDone && results !== null) return <ProductsView items={results} failedPartners={failedPartners} />;
    if (error) return <ErrorState error={error} onRetry={onRetry} />;
    return (
        <Lobby
            onComplete={onComplete}
            categoryCount={categoryCount}
            serverStage={serverStage}
            draft={draft}
            finished={results !== null}
            partners={partners}
            timeoutMs={timeoutMs}
        />
    );
}
