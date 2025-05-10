import React, { useState } from "react";
import { nanoid } from "nanoid";
import type {ChatMessage} from "./types";
import ChatThread from "@/components/Chat/ChatThread";
import MessageInput from "@/components/Chat/MessageInput";

const App: React.FC = () => {
    const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    const handleSend = (content: string) => {
        if (!currentChatId) return;

        const newId = nanoid();
        const parentId = activeThreadId;
        const rootId = parentId
            ? chats[currentChatId].find((m) => m.id === parentId)?.rootId || parentId
            : newId;

        const newMessage: ChatMessage = {
            id: newId,
            chatId: currentChatId,
            rootId,
            parentId: parentId || undefined,
            role: "user",
            content,
            timestamp: Date.now(),
        };

        setChats((prev) => ({
            ...prev,
            [currentChatId]: [...(prev[currentChatId] || []), newMessage],
        }));

        setTimeout(() => {
            const assistantReply: ChatMessage = {
                id: nanoid(),
                chatId: currentChatId,
                parentId: newMessage.id,
                rootId: newMessage.rootId,
                role: "assistant",
                content: `**You said:** ${content.replace(/\n/g, " ").trim()}`,
                timestamp: Date.now() + 1,
            };

            setChats((prev) => ({
                ...prev,
                [currentChatId]: [...(prev[currentChatId] || []), assistantReply],
            }));

            setActiveThreadId(assistantReply.id);
        }, 500);
    };

    const handleNewChat = () => {
        const newChatId = nanoid();
        setChats((prev) => ({
            ...prev,
            [newChatId]: [],
        }));
        setCurrentChatId(newChatId);
        setActiveThreadId(null);
    };

    const handleReply = (id: string) => {
        setActiveThreadId(id);
    };

    const handleClearThread = () => {
        setActiveThreadId(null);
    };

    const handleMoveToChat = (fromMessageId: string) => {
        if (!currentChatId) return;
        const allMessages = chats[currentChatId];
        const messageMap = new Map(allMessages.map((m) => [m.id, m]));

        // Build ancestry chain up to root
        const ancestry: ChatMessage[] = [];
        let current = messageMap.get(fromMessageId);
        while (current) {
            ancestry.unshift(current);
            if (!current.parentId) break;
            current = messageMap.get(current.parentId);
        }

        // Build descendant chain (linear, non-branching only)
        const moveChain: ChatMessage[] = [];
        current = messageMap.get(fromMessageId);
        while (current) {
            moveChain.push(current);
            const children = allMessages.filter((m) => m.parentId === current!.id);
            if (children.length !== 1) break; // stop at branch point or end
            current = children[0];
        }

        const moveIds = new Set(moveChain.map((m) => m.id));
        const idMap = new Map<string, string>();
        for (const msg of [...ancestry, ...moveChain]) {
            idMap.set(msg.id, nanoid());
        }

        const newChatId = nanoid();

        const copiedMessages: ChatMessage[] = [...ancestry, ...moveChain].map((m) => ({
            ...m,
            id: idMap.get(m.id)!,
            chatId: newChatId,
            rootId: idMap.get(ancestry[0].id)!,
            parentId: m.parentId ? idMap.get(m.parentId) : undefined,
        }));

        const retainedMessages = allMessages.filter((m) => !moveIds.has(m.id));

        setChats((prev) => ({
            ...prev,
            [currentChatId]: retainedMessages,
            [newChatId]: copiedMessages,
        }));

        setCurrentChatId(newChatId);
        setActiveThreadId(null);
    };

    const currentMessages = currentChatId ? chats[currentChatId] || [] : [];

    return (
        <div className="flex h-screen bg-background text-foreground">
            <div className="w-64 border-r p-4 flex flex-col gap-2">
                <button onClick={handleNewChat}>+ New Chat</button>
                {Object.keys(chats).map((id) => (
                    <button key={id} onClick={() => setCurrentChatId(id)}>
                        Chat {id.slice(0, 4)}
                    </button>
                ))}
            </div>
            <div className="flex flex-col flex-1">
                {currentChatId ? (
                    <>
                        <div className="flex-1 overflow-auto bg-neutral-950">
                            <div className="min-w-full min-h-full flex justify-center items-start">
                                <div className="p-10 inline-flex">
                                    <ChatThread
                                        messages={currentMessages}
                                        onReply={handleReply}
                                        onMoveToChat={handleMoveToChat}
                                        activeThreadId={activeThreadId}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-2 border-t text-sm text-muted-foreground">
                            Following thread {activeThreadId || "none"}
                            <button className="ml-4 underline" onClick={handleClearThread}>
                                Clear thread
                            </button>
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
