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

    // Effect to fetch initial threads and handle URL-based routing on load
    useEffect(() => {
        getThreads().then(threads => {
            setThreads(threads);

            // After fetching threads, determine the initial chat from the URL
            const path = window.location.pathname;
            const match = path.match(/^\/chat\/([a-zA-Z0-9-:]+)/);
            if (match && threads.some(t => t.id === match[1])) {
                setCurrentThreadId(match[1]);
            }
        }).catch(console.error);

        // Listen for browser back/forward navigation
        const handlePopState = () => {
            const path = window.location.pathname;
            const match = path.match(/^\/chat\/([a-zA-Z0-9-:]+)/);
            setCurrentThreadId(match ? match[1] : null);
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
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
     * Sets the current thread ID, resets the active reply ID, and updates the URL.
     * @param id The ID of the thread to switch to.
     */
    const handleSetCurrentThreadId = (id: string | null) => {
        setCurrentThreadId(id);
        setActiveThreadId(null); // Reset active reply thread when switching main thread

        const url = id ? `/chat/${id}` : '/';
        const title = id ? `Chat ${id}` : 'ThreadWell';
        window.history.pushState({ threadId: id }, title, url);
    }

    /**
     * Creates a new chat thread and sets it as the current one.
     */
    const handleNewChat = async () => {
        const newThread = await createThread();
        setThreads((prev) => [...(prev || []), newThread]);
        handleSetCurrentThreadId(newThread.id);
    };

    /**
     * Moves a message and its descendants to a new chat thread.
     */
    const handleMoveToChat = async (fromMessageId: string) => {
        const newThreadId = await moveSubtree(fromMessageId);
        const newThreads = await getThreads();
        setThreads(newThreads);
        handleSetCurrentThreadId(newThreadId);
    };

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