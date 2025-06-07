import { useState, useEffect } from 'react';
import type { ChatMessage, ChatThread } from '@/types';
import {
    getThreads,
    getMessages,
    createMessage,
    createThread,
    moveSubtree,
} from '@/api';
import { buildLLMHistory, callLLM } from '@/services/llm/llm';

/**
 * Custom hook to encapsulate all chat-related logic,
 * separating it from the UI components.
 */
export function useChat() {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Effect to fetch initial threads on component mount
    useEffect(() => {
        getThreads().then(setThreads).catch(console.error);
    }, []);

    // Effect to fetch messages when the current thread changes
    useEffect(() => {
        if (currentThreadId) {
            setIsLoading(true);
            getMessages(currentThreadId)
                .then(setMessages)
                .catch(() => setMessages([])) // Fallback to avoid crash
                .finally(() => setIsLoading(false));
        } else {
            setMessages([]); // Clear messages if no thread is selected
        }
    }, [currentThreadId]);

    /**
     * Handles sending a new message and receiving a reply from the LLM.
     * @param content The text content of the user's message.
     */
    const handleSend = async (content: string) => {
        if (!currentThreadId) return;

        setIsLoading(true);
        try {
            const userMsg = await createMessage({
                thread_id: currentThreadId,
                root_id: activeThreadId || undefined,
                parent_id: activeThreadId || undefined,
                role: "user",
                content,
                timestamp: Date.now(),
            });
            setMessages((prev) => [...(prev || []), userMsg]);

            const messageHistory = userMsg.parent_id
                ? buildLLMHistory([...messages, userMsg], userMsg.id)
                : [{ role: "user", content: userMsg.content }];

            const llmReply = await callLLM({ messages: messageHistory });

            const reply = await createMessage({
                thread_id: currentThreadId,
                root_id: userMsg.root_id || userMsg.id,
                parent_id: userMsg.id,
                role: "assistant",
                content: llmReply.content,
                timestamp: Date.now() + 1,
            });

            setMessages((prev) => [...(prev || []), reply]);
            setActiveThreadId(reply.id);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Creates a new chat thread and sets it as the current one.
     */
    const handleNewChat = async () => {
        const newThread = await createThread();
        setThreads((prev) => [...(prev || []), newThread]);
        setCurrentThreadId(newThread.id);
        setActiveThreadId(null);
    };

    /**
     * Moves a message and its descendants to a new chat thread.
     * @param fromMessageId The ID of the message to move.
     */
    const handleMoveToChat = async (fromMessageId: string) => {
        const newThreadId = await moveSubtree(fromMessageId);
        // Refresh threads list and switch to the new thread
        const newThreads = await getThreads();
        setThreads(newThreads);
        setCurrentThreadId(newThreadId);
        setActiveThreadId(null);
    };

    /**
     * Sets the current thread ID and resets the active reply ID.
     * @param id The ID of the thread to switch to.
     */
    const handleSetCurrentThreadId = (id: string | null) => {
        setCurrentThreadId(id);
        setActiveThreadId(null); // Reset active reply thread when switching main thread
    }

    // Return all state and handlers needed by the UI
    return {
        threads,
        currentThreadId,
        messages,
        activeThreadId,
        isLoading,
        handleSend,
        handleNewChat,
        handleReply: setActiveThreadId, // This is just a state setter
        handleClearThread: () => setActiveThreadId(null),
        handleMoveToChat,
        handleSetCurrentThreadId,
    };
}