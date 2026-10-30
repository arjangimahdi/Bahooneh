import { ErrorCode, isTerminalEvent, STAGES } from "@/utils/pipe/events";
import { parseEvent } from "@/utils/pipe/schema";
import { PartnerId, ResultItem } from "@/utils/pipe/types";
import { WizardPayload } from "@/utils/wizard/schema";
import { useEffect, useState } from "react";

const TIMEOUT_MS = 30_000;
const CLIENT_GRACE_MS = 5_000;

interface LobbyState {
    timeoutMs: number;
    partners: PartnerId[];
    failedPartners: PartnerId[];
    serverStage: number;
    categoryCount: number;
    candidateCount: number;
}

export function useRecommend(payload: WizardPayload | null) {
    const [state, setState] = useState<LobbyState>({
        timeoutMs: TIMEOUT_MS,
        candidateCount: 0,
        categoryCount: 0,
        failedPartners: [],
        partners: [],
        serverStage: -1,
    });

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
                            setState((s) => ({ ...s, timeoutMs: event.timeoutMs }));
                            timer = setTimeout(() => {
                                controller.abort(new Error("client timeout"));
                            }, event.timeoutMs + CLIENT_GRACE_MS);
                        }

                        if (event.type === "stage") {
                            switch (event.stage) {
                                case "understanding":
                                    setState((s) => ({ ...s }));
                                    break;
                                case "ideating":
                                    setState((s) => ({ ...s, categoryCount: event.categoryCount }));
                                    break;
                                case "fetching":
                                    setState((s) => ({ ...s, partners: event.partners }));
                                    break;
                                case "filtering":
                                    setState((s) => ({ ...s, candidateCount: event.candidateCount }));
                                    break;
                            }

                            setState((s) => ({ ...s, serverStage: STAGES.indexOf(event.stage) }));
                        }
                        if (event.type === "error") setError(event.code);
                        if (event.type === "partner_failed") {
                            setState((s) => ({ ...s, failedPartners: [...s.failedPartners, event.partner] }));
                        }
                        if (event.type === "result") {
                            setResults(event.items);
                            setState((s) => {
                                return {
                                    ...s,
                                    serverStage: STAGES.length,
                                    failedPartners: event.failedPartners,
                                };
                            });
                        }
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
        setError(null);
        setResults(null);

        setState({
            timeoutMs: TIMEOUT_MS,
            candidateCount: 0,
            categoryCount: 0,
            failedPartners: [],
            partners: [],
            serverStage: -1,
        });

        setAttempts((att) => att + 1);
    };

    return {
        ...state,
        results,
        error,
        retry,
    };
}
