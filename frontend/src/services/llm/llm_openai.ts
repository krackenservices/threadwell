import type {LLMRequest, LLMResponse} from "@/services/llm/llm";
import type {Settings} from "@/types";

export async function callOpenAI(req: LLMRequest, settings: Settings): Promise<LLMResponse> {
    const res = await fetch(settings.llm_endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${settings.llm_api_key}`,
        },
        body: JSON.stringify({
            model: settings.llm_name || "gpt-3.5-turbo",
            messages: req.messages,
        }),
    });

    if (!res.ok) throw new Error("OpenAI request failed");

    const data = await res.json();
    return {
        content: data.choices?.[0]?.message?.content || "[No response]",
    };
}
