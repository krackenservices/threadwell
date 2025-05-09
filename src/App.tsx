import { useState } from "react";
import ChatThread from "@/components/Chat/ChatThread";
import MessageInput from "@/components/Chat/MessageInput";
import type { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";

const App = () => {
    const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    const handleSend = (text: string) => {
        if (!currentChatId) return;

        const parentMsg = chats[currentChatId]?.find((m) => m.id === activeThreadId);
        const userMsgId = uuidv4();

        const userMsg: ChatMessage = {
            id: userMsgId,
            chatId: currentChatId,
            parentId: activeThreadId && activeThreadId !== userMsgId ? activeThreadId : undefined,
            rootId: parentMsg?.rootId ?? activeThreadId ?? userMsgId,
            role: "user",
            content: text,
            timestamp: Date.now(),
        };

        const assistantReply: ChatMessage = {
            id: uuidv4(),
            chatId: currentChatId,
            parentId: userMsgId,
            rootId: userMsg.rootId,
            role: "assistant",
            content: `**You said:** ${text.replace(/\n/g, " ").trim()}`,
            timestamp: Date.now() + 1,
        };

        setChats((prev) => ({
            ...prev,
            [currentChatId]: [...(prev[currentChatId] || []), userMsg],
        }));

        setActiveThreadId(userMsgId);

        setTimeout(() => {
            setChats((prev) => ({
                ...prev,
                [currentChatId]: [...(prev[currentChatId] || []), assistantReply],
            }));
            setActiveThreadId(assistantReply.id);
        }, 500);
    };

    const handleMoveToNewChat = (leafId: string) => {
        if (!currentChatId || !chats[currentChatId]) {
            console.warn("No active chat to move from.");
            return;
        }

        const currentMessages = chats[currentChatId];
        const messageMap = new Map(currentMessages.map(m => [m.id, m]));

        // 1. Build ancestry from leaf to root
        const ancestry: ChatMessage[] = [];
        let current = messageMap.get(leafId);
        while (current) {
            ancestry.unshift(current);
            current = current.parentId ? messageMap.get(current.parentId) : undefined;
        }

        // 2. Collect descendants
        const descendants = new Set<string>();
        const collectDescendants = (id: string) => {
            descendants.add(id);
            currentMessages
                .filter(m => m.parentId === id)
                .forEach(child => collectDescendants(child.id));
        };
        collectDescendants(leafId);

        // 3. Find first branching ancestor from bottom
        let stopDeletionIndex = 0;
        for (let i = ancestry.length - 1; i >= 0; i--) {
            const children = currentMessages.filter(m => m.parentId === ancestry[i].id);
            if (children.length > 1) {
                stopDeletionIndex = i;
                break;
            }
        }

        const toDelete = new Set<string>();
        for (let i = ancestry.length - 1; i > stopDeletionIndex; i--) {
            toDelete.add(ancestry[i].id);
        }
        descendants.forEach(id => toDelete.add(id));

        const updatedOriginal = currentMessages.filter(m => !toDelete.has(m.id));

        const fullSet = new Set([...ancestry.map(m => m.id), ...descendants]);
        const fullList = currentMessages.filter(m => fullSet.has(m.id));

        const idMap = new Map<string, string>();
        fullList.forEach(m => idMap.set(m.id, nanoid(6)));

        const remapped = fullList.map(msg => ({
            ...msg,
            id: idMap.get(msg.id)!,
            parentId: msg.parentId ? idMap.get(msg.parentId) ?? null : null,
            rootId: idMap.get(ancestry[0].id)!,
        }));

        const newChatId = nanoid(4);

        setChats(prev => ({
            ...prev,
            [currentChatId]: updatedOriginal,
            [newChatId]: remapped,
        }));

        setCurrentChatId(newChatId);
        setActiveThreadId(remapped[remapped.length - 1].id);
    };

    const createChat = () => {
        const id = uuidv4();
        setChats((prev) => ({ ...prev, [id]: [] }));
        setCurrentChatId(id);
        setActiveThreadId(null);
    };

    const switchChat = (id: string) => {
        setCurrentChatId(id);
        setActiveThreadId(null);
    };

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <div className="w-64 border-r p-4 flex flex-col gap-2">
                <Button onClick={createChat}>+ New Chat</Button>
                <div className="flex flex-col gap-1 mt-4">
                    {Object.keys(chats).map((id) => (
                        <Button
                            key={id}
                            variant={id === currentChatId ? "default" : "secondary"}
                            onClick={() => switchChat(id)}
                        >
                            Chat {id.slice(0, 4)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Main canvas */}
            <div className="flex flex-col flex-1">
                {currentChatId ? (
                    <>
                        {/* Fixed-size scrollable canvas */}
                        <div className="flex-1 overflow-auto bg-neutral-950">
                            <div className="min-w-full min-h-full flex justify-center items-start">
                                <div className="p-10 inline-flex">
                                    <ChatThread
                                        messages={chats[currentChatId] || []}
                                        onReply={setActiveThreadId}
                                        onMoveToChat={handleMoveToNewChat}
                                        activeThreadId={activeThreadId}
                                    />
                                </div>
                            </div>
                        </div>
                        <MessageInput
                            onSend={handleSend}
                            activeThreadId={activeThreadId}
                            clearThread={() => setActiveThreadId(null)}
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
