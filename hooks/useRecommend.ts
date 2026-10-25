import { ErrorCode, isTerminalEvent, StageEvent } from "@/utils/pipe/events";
import { parseEvent } from "@/utils/pipe/schema";
import { ResultItem } from "@/utils/pipe/types";
import { WizardPayload } from "@/utils/wizard/schema";
import { useEffect, useState } from "react";

const TIMEOUT_MS = 30_000;
const CLIENT_GRACE_MS = 5_000;

export function useRecommend(payload: WizardPayload | null) {
    const [stage, setStage] = useState<StageEvent | null>(null);
    const [error, setError] = useState<ErrorCode | null>(null);
    const [results, setResults] = useState<ResultItem[] | null>(null);

    const [attempts, setAttempts] = useState<number>(0);

    useEffect(() => {
        if (!payload) return;

        let timer = setTimeout(() => controller.abort(new Error("client timeout")), TIMEOUT_MS);
        const controller = new AbortController();

        async function hitRecommend() {
            try {
                const res = await fetch("/api/recommend", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });

                if (!res.ok || !res.body) throw new Error(`recommend failed: ${res.status}`);

                const reader = res.body?.pipeThrough(new TextDecoderStream()).getReader();

                let buffer = "";
                for (;;) {
                    const { value, done } = await reader?.read();
                    if (done) break;

                    buffer += value;
                    const lines = buffer.split("\n");
                    buffer = lines.pop() ?? "";

                    for (const line of lines) {
                        const event = parseEvent(line);
                        if (!event) continue;

                        if (event.type === "start") {
                            clearTimeout(timer);
                            timer = setTimeout(() => {
                                controller.abort(new Error("client timeout"));
                            }, event.timeoutMs + CLIENT_GRACE_MS);
                        }

                        if (event.type === "stage") setStage(event);
                        if (event.type === "error") setError(event.code);
                        if (event.type === "result") setResults(event.items);
                        if (isTerminalEvent(event)) return await reader.cancel();
                    }
                }
            } catch (e) {
                if (controller.signal.aborted) {
                    if (controller.signal.reason?.message === "client timeout") setError("timeout");
                    return;
                }
                setError("internal");
            } finally {
                clearTimeout(timer);
            }
        }

        hitRecommend();

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [payload, attempts]);

    const retry = () => {
        setStage(null);
        setError(null);
        setResults(null);

        setAttempts((att) => att + 1);
    };

    return { stage, results, error, retry };
}
