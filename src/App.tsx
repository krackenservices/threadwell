import { useState } from "react";
import ChatThread from "@/components/Chat/ChatThread";
import MessageInput from "@/components/Chat/MessageInput";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";
import { v4 as uuidv4 } from "uuid";

const App = () => {
    const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const handleSend = (text: string) => {
        if (!activeChatId) return;

        const userMsg: ChatMessage = {
            id: uuidv4(),
            chatId: activeChatId,
            parentId: replyingTo ?? undefined,
            role: "user",
            content: text,
            timestamp: Date.now(),
        };

        const reply: ChatMessage = {
            id: uuidv4(),
            chatId: activeChatId,
            parentId: userMsg.id,
            role: "assistant",
            content: replyingTo
                ? `Replying to **${userMsg.content}**\n\nYou said: _${text}_`
                : `You said: _${text}_`,
            timestamp: Date.now() + 1,
        };

        setChats((prev) => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), userMsg],
        }));

        setReplyingTo(null);

        setTimeout(() => {
            setChats((prev) => ({
                ...prev,
                [activeChatId]: [...(prev[activeChatId] || []), reply],
            }));
        }, 800);
    };


    const createChat = () => {
        const newId = uuidv4();
        setChats((prev) => ({ ...prev, [newId]: [] }));
        setActiveChatId(newId);
    };

    const switchChat = (id: string) => {
        setActiveChatId(id);
        setReplyingTo(null);
    };

    return (
        <div className="flex h-screen bg-background text-foreground">
            <div className="w-64 border-r p-4 flex flex-col gap-2">
                <Button onClick={createChat}>+ New Chat</Button>
                <div className="flex flex-col gap-1 mt-4">
                    {Object.keys(chats).map((id) => (
                        <Button
                            key={id}
                            variant={id === activeChatId ? "default" : "secondary"}
                            onClick={() => switchChat(id)}
                        >
                            Chat {id.slice(0, 4)}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col flex-1">
                {activeChatId ? (
                    <>
                        <div className="flex-1 overflow-hidden">
                            <ChatThread
                                messages={chats[activeChatId] || []}
                                onReply={setReplyingTo}
                            />
                        </div>
                        <MessageInput
                            onSend={handleSend}
                            replyingTo={replyingTo}
                            cancelReply={() => setReplyingTo(null)}
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
