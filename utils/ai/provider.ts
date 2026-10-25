import z from "zod";

export interface GenerateOptions<T> {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    signal?: AbortSignal;
}

export interface StructuredLLM {
    readonly id: string;
    generate: <T>(options: GenerateOptions<T>) => Promise<T>;
}

export const LLM_ERROR_KINDS = [
    "config",
    "quota_exhausted",
    "rate_limited",
    "unreachable",
    "server_error",
    "bad_output",
] as const;
export type LLMErrorKind = (typeof LLM_ERROR_KINDS)[number];

export class LLMError extends Error {
    constructor(
        message: string,
        readonly kind: LLMErrorKind,
        readonly cause?: unknown
    ) {
        super(message);
        this.name = "LLMError";
    }
}
