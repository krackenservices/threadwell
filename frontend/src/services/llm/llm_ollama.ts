import type {LLMRequest, LLMResponse} from "./llm";
import type {Settings} from "@/types";

export async function callOllama(req: LLMRequest, settings: Settings): Promise<LLMResponse> {
    const model = settings.llm_model || "llama3";

    const res = await fetch(`${settings.llm_endpoint}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            messages: req.messages,
            stream: false,
        }),
    });

    if (!res.ok) {
        if (res.status === 204) {
            return {content: "[No response]"};
        } else if (res.status === 404) {
            throw new Error("Model not found");
        } else if (res.status === 500) {
            throw new Error("Internal server error");
        } else if (res.status === 503) {
            throw new Error("Service unavailable");
        } else {
            throw new Error("Ollama request failed");
        }
    }

    const data = await res.json();
    return {
        content: data.message?.content || "[No response]",
    };
}
