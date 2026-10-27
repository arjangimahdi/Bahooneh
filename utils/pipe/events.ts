import type { PartnerId, ResultItem } from "./types";

export const STAGES = ["understanding", "ideating", "fetching", "filtering", "assembling"] as const;
export type Stage = (typeof STAGES)[number];

export const ERROR_CODES = ["ai_unavailable", "timeout", "internal"] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export type StageEvent = Extract<RecommendEvent, { type: "stage" }>;
export type ResultEvent = Extract<RecommendEvent, { type: "result" }>;

export type RecommendEvent =
    | { type: "start"; timeoutMs: number }
    | { type: "stage"; stage: "understanding" }
    | { type: "stage"; stage: "ideating"; categoryCount: number; recipientLabel: string }
    | { type: "stage"; stage: "fetching"; partners: PartnerId[] }
    | { type: "stage"; stage: "filtering"; candidateCount: number }
    | { type: "stage"; stage: "assembling" }
    | { type: "partner_failed"; partner: PartnerId }
    | { type: "result"; items: ResultItem[]; failedPartners: PartnerId[] }
    | { type: "error"; code: ErrorCode };

export function encodeEvent(event: RecommendEvent): string {
    return JSON.stringify(event) + "\n";
}

export function isTerminalEvent(event: RecommendEvent): event is Extract<RecommendEvent, { type: "result" | "error" }> {
    return event.type === "result" || event.type === "error";
}
