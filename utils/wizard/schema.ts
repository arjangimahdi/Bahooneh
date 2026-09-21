import z from "zod";
import {
    AGE_RANGES,
    ALLERGIES,
    BUDGET_CEILING,
    BUDGET_FLOOR,
    BUDGET_PRESETS,
    DISLIKES,
    FREE_TEXT_MAX,
    FREE_TEXT_MIN,
    GENDERS,
    INTERESTS,
    OCCASIONS,
    OWNS,
    RELATIONSHIPS,
    VIBES,
} from "./options";
import type { AntiPrefsDraft, BudgetDraft, InterestsDraft, OccasionDraft, TargetDraft, WizardStepId } from "./types";

const required = { message: "common.required" };

const optionalFreeText = z
    .string()
    .trim()
    .max(FREE_TEXT_MAX)
    .refine((value) => value === "" || value.length >= FREE_TEXT_MIN, {
        message: "common.tooShort",
    });

export const targetSchema = z.object({
    ageRange: z.enum(AGE_RANGES, required),
    gender: z.enum(GENDERS, required),
    relationship: z.enum(RELATIONSHIPS, required),
    freeText: optionalFreeText,
}) satisfies z.ZodType<TargetDraft>;

export const occasionSchema = z.object({
    occasion: z.enum(OCCASIONS, required),
    vibe: z.array(z.enum(VIBES)),
    freeText: optionalFreeText,
}) satisfies z.ZodType<OccasionDraft>;

export const interestsSchema = z
    .object({
        interests: z.array(z.enum(INTERESTS)),
        freeText: optionalFreeText,
    })
    .refine((value) => value.interests.length > 0 || value.freeText !== "", {
        message: "wizard.interests.error",
        path: ["interests"],
    }) satisfies z.ZodType<InterestsDraft>;

export const antiPrefsSchema = z.object({
    dislikes: z.array(z.enum(DISLIKES)),
    allergies: z.array(z.enum(ALLERGIES)),
    alreadyOwns: z.array(z.enum(OWNS)),
    freeText: optionalFreeText,
}) satisfies z.ZodType<AntiPrefsDraft>;

const presetIds = BUDGET_PRESETS.map((preset) => preset.id);

export const budgetSchema = z
    .object({
        min: z.number().int().nullable(),
        max: z.number().int().nullable(),
        preset: z.enum(presetIds).nullable(),
    })
    .superRefine((value, ctx) => {
        if (value.min === null || value.max === null) {
            ctx.addIssue({
                code: "custom",
                message: "wizard.budget.errorRequired",
                path: ["range"],
            });
            return;
        }
        if (value.min < BUDGET_FLOOR) {
            ctx.addIssue({
                code: "custom",
                message: "wizard.budget.errorFloor",
                path: ["range"],
            });
            return;
        }
        if (value.max < value.min || value.max > BUDGET_CEILING) {
            ctx.addIssue({
                code: "custom",
                message: "wizard.budget.errorOrder",
                path: ["range"],
            });
        }
    }) satisfies z.ZodType<BudgetDraft>;

export const stepSchemas: Partial<Record<WizardStepId, z.ZodType>> = {
    target: targetSchema,
    occasion: occasionSchema,
    interests: interestsSchema,
    antiPrefs: antiPrefsSchema,
    budget: budgetSchema,
};

export const wizardSchema = z.object({
    target: targetSchema,
    occasion: occasionSchema,
    interests: interestsSchema,
    antiPrefs: antiPrefsSchema,
    budget: budgetSchema,
});

export type WizardPayload = z.infer<typeof wizardSchema>;
