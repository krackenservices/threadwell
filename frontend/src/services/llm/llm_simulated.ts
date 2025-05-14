import type { LLMRequest, LLMResponse } from "@/services/llm/llm";

export function simulateLLM(req: LLMRequest): LLMResponse {
    const last = req.messages[req.messages.length - 1]?.content || "unknown";
    return {
        content: `**(Simulated)** You said: ${last.replace(/\n/g, " ").trim()}`,
    };
}

