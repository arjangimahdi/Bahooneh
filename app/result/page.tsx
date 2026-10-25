"use client";

import { useRecommend } from "@/hooks/useRecommend";
import { WizardPayload, wizardSchema } from "@/utils/wizard/schema";
import { useWizardStore } from "@/utils/wizard/store";
import { WizardDraft } from "@/utils/wizard/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const draftToPayload = (draft: WizardDraft): WizardPayload | null => {
    const result = wizardSchema.safeParse(draft);
    return result.success ? result.data : null;
};

export default function Page() {
    const router = useRouter();
    const draft = useWizardStore((state) => state.draft);

    const payload = useMemo(() => draftToPayload(draft), [draft]);

    const { stage, results, error, retry } = useRecommend(payload);

    useEffect(() => {
        if (!payload) router.push("/wizard");
    }, [router, payload]);

    return (
        <div className="flex flex-col gap-4">
            <pre className="text-wrap font-mono p-3 bg-olive-600 rounded-2xl" dir="ltr">
                {JSON.stringify(payload)}
            </pre>
            {error && (
                <div className="flex items-center gap-3 font-mono" dir="ltr">
                    <span className="text-warn">error: {error}</span>
                    <button
                        type="button"
                        onClick={retry}
                        className="cursor-pointer rounded-full border border-line px-4 py-1"
                    >
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
}
