import { PartnerAdapter, SearchQuery } from "../types";

export const MAX_TICKETS = 3;

interface LimitOptions {
    maxTickets?: number;
}

export function withLimit(adapter: PartnerAdapter, options: LimitOptions = {}): PartnerAdapter {
    let active = 0;
    const maxTickets = options.maxTickets ?? MAX_TICKETS;
    const queue: Array<() => void> = [];

    function release() {
        const next = queue.shift();
        if (next) next();
        else active -= 1;
    }

    return {
        ...adapter,
        async search(query: SearchQuery, signal: AbortSignal) {
            if (signal.aborted) {
                throw signal.reason;
            }

            if (active < maxTickets) {
                active += 1;
            } else {
                await new Promise<void>((resolve, reject) => {
                    const wakeUp = () => {
                        signal.removeEventListener("abort", onAbort);
                        resolve();
                    };
                    const onAbort = () => {
                        const foundIndex = queue.indexOf(wakeUp);
                        if (foundIndex >= 0) {
                            queue.splice(foundIndex, 1);
                        }

                        reject(signal.reason);
                    };

                    queue.push(wakeUp);
                    signal.addEventListener("abort", onAbort, {
                        once: true,
                    });
                });
            }
            try {
                return await adapter.search(query, signal);
            } finally {
                release();
            }
        },
    };
}
