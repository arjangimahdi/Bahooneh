import z from "zod";
import { StructuredLLM, GenerateOptions, LLMError } from "../provider";

interface ChatCompletion {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    error?: { message?: string };
}

export function createIranRouter(): StructuredLLM {
    const baseUrl = process.env.IRANROUTER_BASE_URL;
    const apiKey = process.env.IRANROUTER_API_KEY;
    const modelName = process.env.AI_MODEL;
    const id = `iranrouter:${modelName}`;

    return {
        id,
        async generate<T>({ system, user, schema, signal }: GenerateOptions<T>): Promise<T> {
            if (!apiKey) throw new LLMError("IRANROUTER_API_KEY is not set");

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
                throw new LLMError("iranrouter unreachable", error);
            }

            const body = (await res.json().catch(() => ({}))) as ChatCompletion;
            if (!res.ok || body.error) {
                throw new LLMError(`iranrouter error ${res.status}: ${body.error?.message ?? res.statusText}`);
            }

            const content = body.choices?.[0]?.message?.content?.trim() ?? "";
            let json;
            try {
                json = JSON.parse(content);
            } catch (error) {
                throw new LLMError("iranrouter returned non-JSON content", error);
            }
            console.log('json', json)
            const parsed = schema.safeParse(json);
            if (!parsed.success) throw new LLMError("iranrouter output failed schema validation", parsed.error);
            return parsed.data;
        },
    };
}
