import { describe, expect, it } from "vitest";
import { STAGES } from "@/utils/pipe/events";
import { FAST_FORWARD_MS, MIN_STAGE_MS, nextStageStep } from "./waitingTimer";

const last = STAGES.length - 1;

describe("nextStageStep", () => {
    it("waits the stage's minimum time while the server is behind", () => {
        expect(nextStageStep({ displayStage: 1, serverStage: 1, finished: false })).toEqual({
            delayMs: MIN_STAGE_MS.ideating,
            action: "wait",
        });
    });

    it("advances after the minimum time when the server is ahead", () => {
        expect(nextStageStep({ displayStage: 1, serverStage: 3, finished: false })).toEqual({
            delayMs: MIN_STAGE_MS.ideating,
            action: "advance",
        });
    });

    it("fast-forwards once the stream has finished", () => {
        expect(nextStageStep({ displayStage: 0, serverStage: 0, finished: true })).toEqual({
            delayMs: FAST_FORWARD_MS,
            action: "advance",
        });
    });

    it("never advances past the last stage while not finished", () => {
        expect(nextStageStep({ displayStage: last, serverStage: 5, finished: false })).toEqual({
            delayMs: MIN_STAGE_MS.assembling,
            action: "wait",
        });
    });

    it("completes on the last stage once finished", () => {
        expect(nextStageStep({ displayStage: last, serverStage: 5, finished: true })).toEqual({
            delayMs: FAST_FORWARD_MS,
            action: "complete",
        });
    });
});
