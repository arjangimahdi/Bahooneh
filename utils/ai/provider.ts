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

export class LLMError extends Error {
    constructor(
        message: string,
        readonly cause?: unknown
    ) {
        super(message);
        this.name = "LLMError";
    }
}
