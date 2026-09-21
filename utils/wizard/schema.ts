import z from "zod";
import { AGE_RANGES, FREE_TEXT_MAX, FREE_TEXT_MIN, GENDERS, RELATIONSHIPS } from "./options";
import type { TargetDraft, WizardStepId } from "./types";

const required = { message: "common.required" };

const optionalFreeText = z
    .string()
    .trim()
    .max(FREE_TEXT_MAX)
    .refine((value) => value === "" || value.length >= FREE_TEXT_MIN, { message: "common.tooShort" });

export const targetSchema = z.object({
    ageRange: z.enum(AGE_RANGES, required),
    gender: z.enum(GENDERS, required),
    relationship: z.enum(RELATIONSHIPS, required),
    freeText: optionalFreeText,
}) satisfies z.ZodType<TargetDraft>;

export const stepSchemas: Partial<Record<WizardStepId, z.ZodType>> = {
    target: targetSchema,
};
