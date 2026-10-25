import { z } from "zod";
import { ERROR_CODES, type RecommendEvent } from "./events";
import { PARTNER_IDS, type Product, type ResultItem } from "./types";

export const partnerIdSchema = z.enum(PARTNER_IDS);

export const productSchema = z.object({
    id: z.string(),
    partner: partnerIdSchema,
    title: z.string(),
    imageUrl: z.url().nullable(),
    price: z.number(),
    url: z.url(),
    available: z.boolean(),
    category: z.string().optional(),
}) satisfies z.ZodType<Product>;

export const resultItemSchema = z.object({
    product: productSchema,
    affiliateUrl: z.url(),
    rationale: z.string(),
}) satisfies z.ZodType<ResultItem>;

const startEventSchema = z.object({
    type: z.literal("start"),
    timeoutMs: z.number().int().positive(),
});

const understandingStageSchema = z.object({
    type: z.literal("stage"),
    recipientLabel: z.string(),
    stage: z.literal("understanding"),
});

const ideatingStageSchema = z.object({
    type: z.literal("stage"),
    stage: z.literal("ideating"),
    categoryCount: z.number().int().nonnegative(),
});

const fetchingStageSchema = z.object({
    type: z.literal("stage"),
    stage: z.literal("fetching"),
    partners: z.array(partnerIdSchema),
});

const filteringStageSchema = z.object({
    type: z.literal("stage"),
    stage: z.literal("filtering"),
    candidateCount: z.number().int().nonnegative(),
});

const assemblingStageSchema = z.object({
    type: z.literal("stage"),
    stage: z.literal("assembling"),
});

const stageEventSchema = z.discriminatedUnion("stage", [
    understandingStageSchema,
    ideatingStageSchema,
    fetchingStageSchema,
    filteringStageSchema,
    assemblingStageSchema,
]);

const partnerFailedEventSchema = z.object({
    type: z.literal("partner_failed"),
    partner: partnerIdSchema,
});

const resultEventSchema = z.object({
    type: z.literal("result"),
    items: z.array(resultItemSchema),
    failedPartners: z.array(partnerIdSchema),
});

const errorEventSchema = z.object({
    type: z.literal("error"),
    code: z.enum(ERROR_CODES),
});

export const recommendEventSchema = z.discriminatedUnion("type", [
    startEventSchema,
    stageEventSchema,
    partnerFailedEventSchema,
    resultEventSchema,
    errorEventSchema,
]) satisfies z.ZodType<RecommendEvent>;

export function parseEvent(line: string): RecommendEvent | null {
    const trimmed = line.trim();
    if (trimmed === "") return null;
    let raw: unknown;
    try {
        raw = JSON.parse(trimmed);
    } catch {
        return null;
    }
    const result = recommendEventSchema.safeParse(raw);
    return result.success ? result.data : null;
}
