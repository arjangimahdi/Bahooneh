import { PartnerId } from "../pipe/types";
import { digikala } from "./digikala";
import type { PartnerAdapter } from "./types";
import { withCache } from "./wrappers/cache";
import { withCooldown } from "./wrappers/cooldown";
import { withLimit } from "./wrappers/limit";

export const partners: PartnerAdapter[] = [
    withCache(withCooldown(withLimit(digikala)), { maxEntries: 30, ttlMs: 30 * 60_000 }),
];

export const byId = new Map(partners.map((p) => [p.id, p]));
