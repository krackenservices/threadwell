import type {LLMRequest, LLMResponse} from "./llm";
import type {Settings} from "@/types";

export async function callOllama(req: LLMRequest, settings: Settings): Promise<LLMResponse> {
    const model = settings.llm_name || "llama3";

    const res = await fetch(`${settings.llm_endpoint}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages: req.messages,
            stream: false,
        }),
    });

    if (!res.ok) throw new Error("Ollama request failed");

    const data = await res.json();
    return {
        content: data.message?.content || "[No response]",
    };
}
