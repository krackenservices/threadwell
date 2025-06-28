import { useState, useEffect } from 'react';
import type { ChatMessage, ChatThread } from '@/types';
import {
    getThreads,
    getMessages,
    createMessage,
    createThread,
    moveSubtree,
    updateThread,
} from '@/api';
import { buildLLMHistory, callLLM } from '@/services/llm/llm';
import { findDefaultParent } from "@/utils/tree"; // <-- Import the new function

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

    useEffect(() => {
        if (currentThreadId) {
            setIsLoading(true);
            getMessages(currentThreadId)
                .then(setMessages)
                .catch(() => setMessages([])) // Fallback
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

        let parent: ChatMessage | null = null;
        if (activeThreadId) {
            // Find the explicitly selected parent message
            parent = messages.find(m => m.id === activeThreadId) || null;
        } else {
            // If no message is active, find the default parent from the leftmost branch
            parent = findDefaultParent(messages);
        }

        const parentId = parent?.id;
        // The root of the new message is the parent's root, or the parent itself if it's a root.
        // If parent is null, this will be undefined, creating a new root message as before.
        const rootId = parent?.root_id || parent?.id;


        setIsLoading(true);
        try {
            const userMsg = await createMessage({
                thread_id: currentThreadId,
                root_id: rootId,
                parent_id: parentId,
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

    const handleSetCurrentThreadId = (id: string | null) => {
        setCurrentThreadId(id);
        setActiveThreadId(null); // Reset active reply thread when switching main thread

        const url = id ? `/chat/${id}` : '/';
        const title = id ? `Chat ${id}` : 'ThreadWell';
        window.history.pushState({ threadId: id }, title, url);
    }

    const handleNewChat = async () => {
        const newThread = await createThread();
        setThreads((prev) => [...(prev || []), newThread]);
        handleSetCurrentThreadId(newThread.id);
    };

    const handleMoveToChat = async (fromMessageId: string) => {
        const newThreadId = await moveSubtree(fromMessageId);
        const newThreads = await getThreads();
        setThreads(newThreads);
        handleSetCurrentThreadId(newThreadId);
    };

    const handleUpdateThreadTitle = async (threadId: string, title: string) => {
        const originalThreads = [...threads];
        const optimisticThread = {
            ...originalThreads.find((t) => t.id === threadId)!,
            title,
        };

        setThreads(prev =>
            prev.map(t => (t.id === threadId ? optimisticThread : t))
        );

        try {
            await updateThread(threadId, title);
        } catch (error) {
            console.error("Failed to update thread title:", error);
            // Revert on failure
            setThreads(originalThreads);
            alert("Error: Could not save the new title.");
        }
    };

    return {
        threads,
        currentThreadId,
        messages,
        activeThreadId,
        isLoading,
        handleSend,
        handleNewChat,
        handleReply: setActiveThreadId,
        handleClearThread: () => setActiveThreadId(null),
        handleMoveToChat,
        handleSetCurrentThreadId,
        handleUpdateThreadTitle,
    };
}