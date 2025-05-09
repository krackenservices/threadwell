export interface ChatMessage {
    id: string;
    chatId: string;
    parentId?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface ThreadedMessageNode {
    message: ChatMessage;
    children: ThreadedMessageNode[];
}
