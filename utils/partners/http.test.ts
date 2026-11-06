import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { partnerFetchJson, RETRY_DELAY_MS, sleep } from "./http";
import { PartnerError } from "./types";

const URL = "https://api.example.test/search";
const HEADERS = { accept: "application/json", referer: "https://example.test/" };

const json =
    (status: number, body: unknown = { ok: true }) =>
    () =>
        new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const fakeFetch = (...replies: (() => Response)[]) => {
    const fake = vi.fn(async () => {
        const reply = replies.shift();
        if (!reply) throw new Error("unexpected fetch");
        return reply();
    });
    vi.stubGlobal("fetch", fake);
    return fake;
};

const settle = async (promise: Promise<unknown>) => {
    const outcome = promise.then(
        (value) => ({ value, error: undefined }),
        (error: unknown) => ({ value: undefined, error })
    );
    await vi.runAllTimersAsync();
    return outcome;
};

const run = (signal?: AbortSignal) => partnerFetchJson("digikala", URL, { signal, headers: HEADERS });

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("partnerFetchJson", () => {
    it("returns the JSON body of a 200 in one call", async () => {
        const fake = fakeFetch(json(200, { a: 1 }));
        expect(await settle(run())).toEqual({ value: { a: 1 }, error: undefined });
        expect(fake).toHaveBeenCalledTimes(1);
    });

    it.each([500, 429])("retries once after %i and returns the second answer", async (status) => {
        const fake = fakeFetch(json(status), json(200, { a: 2 }));
        expect((await settle(run())).value).toEqual({ a: 2 });
        expect(fake).toHaveBeenCalledTimes(2);
    });

    it("waits the retry delay before the second call", async () => {
        const fake = fakeFetch(json(500), json(200));
        const pending = run();
        await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS - 1);
        expect(fake).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(fake).toHaveBeenCalledTimes(2);
        await pending;
    });

    it("gives up after a second 503", async () => {
        const fake = fakeFetch(json(503), json(503));
        const { error } = await settle(run());
        expect(error).toBeInstanceOf(PartnerError);
        expect(error).toMatchObject({ status: 503, partner: "digikala" });
        expect(fake).toHaveBeenCalledTimes(2);
    });

    it.each([404, 403])("does not retry a %i", async (status) => {
        const fake = fakeFetch(json(status));
        const { error } = await settle(run());
        expect(error).toBeInstanceOf(PartnerError);
        expect(error).toMatchObject({ status, partner: "digikala" });
        expect(fake).toHaveBeenCalledTimes(1);
    });

    it("rejects an HTML answer as not JSON", async () => {
        fakeFetch(() => new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } }));
        const { error } = await settle(run());
        expect(error).toBeInstanceOf(PartnerError);
        expect(error).toMatchObject({ message: "not JSON", status: 200, partner: "digikala" });
    });

    it("reports a network failure as unreachable with no status", async () => {
        const cause = new TypeError("fetch failed");
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(cause));
        const { error } = await settle(run());
        expect(error).toBeInstanceOf(PartnerError);
        expect(error).toMatchObject({ message: "unreachable", status: undefined, partner: "digikala", cause });
    });

    it("rejects with the abort reason when aborted during the retry wait", async () => {
        const fake = fakeFetch(json(500), json(200));
        const controller = new AbortController();
        const reason = new Error("stop");
        const pending = run(controller.signal).catch((e: unknown) => e);
        await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS / 2);
        controller.abort(reason);
        const error = await pending;
        expect(error).toBe(reason);
        expect(error).not.toBeInstanceOf(PartnerError);
        expect(fake).toHaveBeenCalledTimes(1);
    });

    it("sends the given headers and skips the cache", async () => {
        const fake = fakeFetch(json(200));
        const controller = new AbortController();
        await settle(run(controller.signal));
        expect(fake).toHaveBeenCalledWith(URL, { signal: controller.signal, headers: HEADERS, cache: "no-store" });
    });
});

describe("sleep", () => {
    it("resolves after the given time", async () => {
        let done = false;
        void sleep(800).then(() => (done = true));
        await vi.advanceTimersByTimeAsync(799);
        expect(done).toBe(false);
        await vi.advanceTimersByTimeAsync(1);
        expect(done).toBe(true);
    });

    it("rejects with the reason as soon as the signal aborts", async () => {
        const controller = new AbortController();
        const reason = new Error("stop");
        const pending = sleep(800, controller.signal);
        controller.abort(reason);
        await expect(pending).rejects.toBe(reason);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("rejects right away when the signal is already aborted", async () => {
        const reason = new Error("stop");
        await expect(sleep(800, AbortSignal.abort(reason))).rejects.toBe(reason);
    });
});
