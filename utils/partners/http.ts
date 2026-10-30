import type { PartnerId } from "../pipe/types";
import { PartnerError } from "./types";

export const RETRY_DELAY_MS = 800;

export const BROWSER_HEADERS = {
    accept: "application/json, text/plain, */*",
    "accept-language": "fa-IR,fa;q=0.9,en;q=0.8",
    "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
};

export interface PartnerFetchOptions {
    signal?: AbortSignal;
    headers?: Record<string, string>;
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        signal?.throwIfAborted();
        const onAbort = () => {
            clearTimeout(timer);
            reject(signal?.reason);
        };
        const timer = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}

export async function partnerFetchJson(
    partner: PartnerId,
    url: string,
    { signal, headers }: PartnerFetchOptions
): Promise<unknown> {
    const send = async () => {
        try {
            return await fetch(url, { signal, headers, cache: "no-store" });
        } catch (error) {
            if (signal?.aborted) throw error;
            throw new PartnerError("unreachable", partner, undefined, error);
        }
    };

    let res = await send();
    if (res.status === 429 || res.status >= 500) {
        await sleep(RETRY_DELAY_MS, signal);
        res = await send();
    }

    if (!res.ok) throw new PartnerError("request failed", partner, res.status);

    try {
        return await res.json();
    } catch (error) {
        if (signal?.aborted) throw error;
        throw new PartnerError("not JSON", partner, res.status, error);
    }
}
