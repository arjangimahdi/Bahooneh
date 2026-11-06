import { PartnerAdapter, PartnerError } from "../types";

const DEFAULT_MAX_STRIKES = 3;
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1_000;

interface CooldownOptions {
    maxStrikes?: number;
    cooldownMs?: number;
}

export function withCooldown(adapter: PartnerAdapter, options: CooldownOptions = {}): PartnerAdapter {
    const maxStrikes = options.maxStrikes ?? DEFAULT_MAX_STRIKES;
    const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    let strikes = 0;
    let cooldownUntil = 0;

    return {
        ...adapter,
        async search(query, signal) {
            if (Date.now() < cooldownUntil) throw new PartnerError("cooling down", adapter.id, 0);

            try {
                const products = await adapter.search(query, signal);
                strikes = 0;
                return products;
            } catch (error) {
                if (error instanceof PartnerError && (error.status === 429 || error.status === 403)) {
                    strikes += 1;
                    if (strikes >= maxStrikes) {
                        cooldownUntil = Date.now() + cooldownMs;
                        strikes = 0;
                    }
                }
                throw error;
            }
        },
    };
}
