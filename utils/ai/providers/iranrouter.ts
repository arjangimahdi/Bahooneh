import z from "zod";
import { StructuredLLM, GenerateOptions, LLMError, type LLMErrorKind } from "../provider";

interface ChatCompletion {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
}

const kindForStatus = (status: number): LLMErrorKind => {
    if (status === 402) return "quota_exhausted";
    if (status === 429) return "rate_limited";
    if (status >= 500) return "server_error";
    return "config";
};

export function createIranRouter(): StructuredLLM {
    const baseUrl = process.env.IRANROUTER_BASE_URL;
    const apiKey = process.env.IRANROUTER_API_KEY;
    const modelName = process.env.AI_MODEL;
    const id = `iranrouter:${modelName}`;

    return {
        id,
        async generate<T>({ system, user, schema, signal }: GenerateOptions<T>): Promise<T> {
            if (!baseUrl) throw new LLMError("IRANROUTER_BASE_URL is not set", "config");
            if (!apiKey) throw new LLMError("IRANROUTER_API_KEY is not set", "config");
            if (!modelName) throw new LLMError("AI_MODEL is not set", "config");

            let res: Response;
            try {
                res = await fetch(`${baseUrl}/chat/completions`, {
                    method: "POST",
                    signal,
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        model: modelName,
                        stream: false,
                        temperature: 0.4,
                        response_format: { type: "json_object" },
                        messages: [
                            {
                                role: "system",
                                content: `${system}\n\nRespond with a single JSON object that matches this JSON Schema:\n${JSON.stringify(z.toJSONSchema(schema))}`,
                            },
                            { role: "user", content: user },
                        ],
                    }),
                });
            } catch (error) {
                if (signal?.aborted) throw error;
                throw new LLMError("iranrouter unreachable", "unreachable", error);
            }

            const body = (await res.json().catch(() => ({}))) as ChatCompletion;
            if (!res.ok) {
                const detail = body.error?.message;
                const message = detail ? `iranrouter error ${res.status}: ${detail}` : `iranrouter error ${res.status}`;
                throw new LLMError(message, kindForStatus(res.status));
            }

            const content = body.choices?.[0]?.message?.content?.trim();
            if (!content) throw new LLMError("iranrouter returned no content", "bad_output");

            let json: unknown;
            try {
                json = JSON.parse(content);
            } catch (error) {
                throw new LLMError("iranrouter returned non-JSON content", "bad_output", error);
            }

            const parsed = schema.safeParse(json);
            if (!parsed.success) {
                throw new LLMError("iranrouter output failed schema validation", "bad_output", parsed.error);
            }
            return parsed.data;
        },
    };
}
