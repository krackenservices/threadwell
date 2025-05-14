export interface ThreadedMessageNode {
    message: ChatMessage;
    children: ThreadedMessageNode[];
}

export interface ChatThread {
    id: string;
    title: string;
    created_at: number;
}

export interface ChatMessage {
    id: string;
    thread_id: string;
    root_id?: string;
    parent_id?: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
}

export type LLMProvider = "simulator" | "openai" | "ollama" | "google";

export interface Settings {
    id: string;
    llm_provider: LLMProvider;
    llm_endpoint: string;
    llm_api_key?: string;
    llm_model?: string;
    simulate_only: boolean;
}
