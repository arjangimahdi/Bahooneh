import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { LLMError, type LLMErrorKind } from "../provider";
import { createIranRouter } from "./iranrouter";

const schema = z.object({ answer: z.string() });
const fetchMock = vi.fn<typeof fetch>();

const chat = (content: unknown) =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

const failure = (status: number) =>
    new Response(JSON.stringify({ error: { message: "upstream said no" } }), { status });

const setEnv = () => {
    vi.stubEnv("IRANROUTER_BASE_URL", "https://router.test/v1");
    vi.stubEnv("IRANROUTER_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "test-model");
};

const generate = (signal?: AbortSignal) =>
    createIranRouter().generate({ system: "system", user: "user", schema, signal });

const caught = (promise: Promise<unknown>) =>
    promise.then(
        () => null,
        (error: unknown) => error
    );

const expectKind = async (promise: Promise<unknown>, kind: LLMErrorKind) => {
    const error = await caught(promise);
    expect(error).toBeInstanceOf(LLMError);
    expect((error as LLMError).kind).toBe(kind);
    return error as LLMError;
};

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("iranrouter generate", () => {
    it("returns the parsed data on success", async () => {
        setEnv();
        fetchMock.mockResolvedValue(chat(JSON.stringify({ answer: "ok" })));
        await expect(generate()).resolves.toEqual({ answer: "ok" });
    });

    it.each([
        [401, "config"],
        [402, "quota_exhausted"],
        [429, "rate_limited"],
        [500, "server_error"],
    ] as const)("maps HTTP %i to %s", async (status, kind) => {
        setEnv();
        fetchMock.mockResolvedValue(failure(status));
        const error = await expectKind(generate(), kind);
        expect(error.message).toBe(`iranrouter error ${status}: upstream said no`);
        expect(error.message).not.toContain("test-key");
    });

    it("reports unreachable when fetch rejects", async () => {
        setEnv();
        fetchMock.mockRejectedValue(new TypeError("fetch failed"));
        await expectKind(generate(), "unreachable");
    });

    it("reports bad_output for non-JSON content", async () => {
        setEnv();
        fetchMock.mockResolvedValue(chat("not json"));
        await expectKind(generate(), "bad_output");
    });

    it("reports bad_output for JSON that fails the schema", async () => {
        setEnv();
        fetchMock.mockResolvedValue(chat(JSON.stringify({ answer: 42 })));
        await expectKind(generate(), "bad_output");
    });

    it("rethrows the original error when the signal is aborted", async () => {
        setEnv();
        const controller = new AbortController();
        const abortError = new DOMException("aborted", "AbortError");
        controller.abort(abortError);
        fetchMock.mockRejectedValue(abortError);
        const error = await caught(generate(controller.signal));
        expect(error).toBe(abortError);
        expect(error instanceof LLMError).toBe(false);
    });

    it.each(["IRANROUTER_BASE_URL", "IRANROUTER_API_KEY", "AI_MODEL"])(
        "reports config when %s is missing",
        async (name) => {
            setEnv();
            vi.stubEnv(name, "");
            const error = await expectKind(generate(), "config");
            expect(error.message).toBe(`${name} is not set`);
            expect(fetchMock).not.toHaveBeenCalled();
        }
    );
});
