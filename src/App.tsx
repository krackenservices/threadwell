import { useState } from "react";
import ChatThread from "@/components/Chat/ChatThread";
import MessageInput from "@/components/Chat/MessageInput";
import type { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";

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
