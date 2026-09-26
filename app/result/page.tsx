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

    const {} = useRecommend(payload);

    useEffect(() => {
        if (!payload) router.push("/wizard");
    }, [router, payload]);

    return (
        <div>
            <pre>{JSON.stringify(payload)}</pre>
        </div>
    );
}
