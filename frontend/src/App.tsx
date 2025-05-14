import React, { useEffect, useState } from "react";
import type { ChatMessage, ChatThread } from "@/types";
import { buildLLMHistory, callLLM } from "@/services/llm/llm";

import ChatThreadView from "@/components/Chat/ChatThread";
import MessageInput from "@/components/Chat/MessageInput";
import {
    getThreads,
    getMessages,
    createMessage,
    createThread,
    moveSubtree,
} from "@/api";
import {SettingsDialog} from "@/components/Chat/SettingsDialog.tsx";



const App: React.FC = () => {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);


    useEffect(() => {
        getThreads().then(setThreads);
    }, []);

    useEffect(() => {
        if (currentThreadId) {
            getMessages(currentThreadId)
                .then(setMessages)
                .catch(() => setMessages([])); // fallback to avoid crash
        }
    }, [currentThreadId]);

    const handleSend = async (content: string) => {
        if (!currentThreadId) return;

        const userMsg = await createMessage({
            thread_id: currentThreadId,
            root_id: activeThreadId || undefined,
            parent_id: activeThreadId || undefined,
            role: "user",
            content,
            timestamp: Date.now(),
        });

        setMessages((prev) => [...prev || [], userMsg]);

        const messageContext = userMsg.parent_id
            ? buildLLMHistory([...messages, userMsg], userMsg.id)
            : [{ role: "user", content: userMsg.content }];

        const llmReply = await callLLM({ messages: messageContext });

        const reply = await createMessage({
            thread_id: currentThreadId,
            root_id: userMsg.root_id || userMsg.id,
            parent_id: userMsg.id,
            role: "assistant",
            content: llmReply.content,
            timestamp: Date.now() + 1,
        });

        setMessages((prev) => [...prev, reply]);
        setActiveThreadId(reply.id);
    };

    const handleNewChat = async () => {
        const newThread = await createThread();
        setThreads((prev) => [...prev || [], newThread]);
        setCurrentThreadId(newThread.id);
        setActiveThreadId(null);
        setMessages([]);
    };

    const handleReply = (id: string) => {
        setActiveThreadId(id);
    };

    const handleClearThread = () => {
        setActiveThreadId(null);
    };

    const handleMoveToChat = async (fromMessageId: string) => {
        const newThreadId = await moveSubtree(fromMessageId);
        const newThreads = await getThreads();
        setThreads(newThreads);
        setCurrentThreadId(newThreadId);
        setActiveThreadId(null);
        const movedMessages = await getMessages(newThreadId);
        setMessages(movedMessages);
    };

    return (
        <div className="flex h-screen bg-background text-foreground">
            <div className="w-64 border-r p-4 flex flex-col gap-2">
                <button onClick={() => setShowSettings(true)}>⚙️ Settings</button>
                {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
                <button onClick={handleNewChat}>+ New Chat</button>
                {threads?.length ? threads.map((t) => (
                    <button key={t.id} onClick={() => setCurrentThreadId(t.id)}>
                        {t.title === "New Thread" ? `Chat ${t.id.slice(4, 8)}` : t.title}
                    </button>
                )): <p className="text-muted">No threads</p>}
            </div>
            <div className="flex flex-col flex-1">
                {currentThreadId ? (
                    <>
                        <div className="flex-1 overflow-auto bg-neutral-950">
                            <div className="min-w-full min-h-full flex justify-center items-start">
                                <div className="p-10 inline-flex">
                                    <ChatThreadView
                                        messages={messages}
                                        onReply={handleReply}
                                        onMoveToChat={handleMoveToChat}
                                        activeThreadId={activeThreadId}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-2 border-t text-sm text-muted-foreground">
                            Following thread {activeThreadId || "none"}
                        </div>
                        <MessageInput
                            onSend={handleSend}
                            activeThreadId={activeThreadId}
                            clearThread={handleClearThread}
                        />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select or create a chat to start messaging.
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
