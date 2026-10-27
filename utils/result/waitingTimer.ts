import { STAGES, type Stage } from "@/utils/pipe/events";

export const MIN_STAGE_MS: Record<Stage, number> = {
    understanding: 1500,
    ideating: 2000,
    fetching: 3500,
    filtering: 2500,
    assembling: 2000,
};
export const FAST_FORWARD_MS = 2500;
export const REASSURANCE_AFTER_MS = 20_000;

export interface StageStepInput {
    displayStage: number;
    serverStage: number;
    finished: boolean;
}

export interface StageStep {
    delayMs: number;
    action: "advance" | "complete" | "wait";
}

export function nextStageStep({ displayStage, serverStage, finished }: StageStepInput): StageStep {
    const delayMs = finished ? FAST_FORWARD_MS : MIN_STAGE_MS[STAGES[displayStage]];

    if (displayStage >= STAGES.length - 1) return { delayMs, action: finished ? "complete" : "wait" };
    return { delayMs, action: serverStage > displayStage || finished ? "advance" : "wait" };
}
