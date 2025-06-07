import { getSettings } from "@/api";
import type {ChatMessage, Settings} from "@/types";
import { simulateLLM } from "@/services/llm/llm_simulated";
import { callOpenAI } from "@/services/llm/llm_openai";
import { callOllama } from "@/services/llm/llm_ollama";
import { buildAncestryChain } from "@/utils/tree.ts";

export interface LLMRequest {
    messages: { role: string; content: string }[];
}

export interface LLMResponse {
    content: string;
}

export function buildLLMHistory(messages: ChatMessage[], fromId: string) {
    const chain = buildAncestryChain(messages, fromId);

    return chain.map(m => ({ role: m.role, content: m.content }));
}

export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
    const settings: Settings = await getSettings();

    if (settings.simulate_only) {
        return simulateLLM(req);
    }

    switch (settings.llm_provider) {
        case "openai":
            return callOpenAI(req, settings);
        case "ollama":
            return callOllama(req, settings);
        default:
            throw new Error("Unsupported LLM provider: " + settings.llm_provider);
    }
}
