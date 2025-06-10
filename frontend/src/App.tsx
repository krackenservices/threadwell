import React, { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { Settings, MessageSquarePlus } from "lucide-react";

import ChatThreadView from "@/components/Chat/ChatThread";
import MessageInput from "@/components/Chat/MessageInput";
import { SettingsDialog } from "@/components/Chat/SettingsDialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const App: React.FC = () => {
    const {
        threads,
        currentThreadId,
        messages,
        activeThreadId,
        isLoading,
        handleSend,
        handleNewChat,
        handleReply,
        handleClearThread,
        handleMoveToChat,
        handleSetCurrentThreadId,
    } = useChat();

    // UI-specific state, like the visibility of a dialog, can remain in the component.
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* --- Sidebar UI --- */}
            <aside className="w-72 flex flex-col bg-sidebar text-sidebar-foreground p-4">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2">
                        <Button
                            variant="secondary"
                            className="w-full justify-start gap-2"
                            onClick={handleNewChat}
                            disabled={isLoading}
                        >
                            <MessageSquarePlus size={18} />
                            New Chat
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        <nav className="flex flex-col gap-2 p-2">
                            {threads?.length > 0 ? (
                                threads.map((t) => (
                                    <Button
                                        key={t.id}
                                        variant={currentThreadId === t.id ? "secondary" : "ghost"}
                                        className="w-full justify-start"
                                        onClick={() => handleSetCurrentThreadId(t.id)}
                                        disabled={isLoading}
                                    >
                                        <span className="truncate">
                                            {t.title === "New Thread" ? `Chat ${t.id.slice(4, 8)}` : t.title}
                                        </span>
                                    </Button>
                                ))
                            ) : (
                                <p className="p-4 text-sm text-muted-foreground">No threads yet.</p>
                            )}
                        </nav>
                    </ScrollArea>
                </div>

                <div className="p-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={() => setShowSettings(true)}
                    >
                        <Settings size={18} />
                        Settings
                    </Button>
                </div>

                {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
            </aside>


            {/* --- Main Content UI --- */}
            <main className="flex flex-col flex-1">
                {currentThreadId ? (
                    <>
                        <div className="flex-1 overflow-auto bg-neutral-950">
                            <div className="min-w-full min-h-full flex justify-center items-start">
                                <div className="p-10 inline-flex">
                                    {isLoading && messages.length === 0 ? (
                                        <p>Loading chat...</p>
                                    ) : (
                                        <ChatThreadView
                                            messages={messages}
                                            onReply={handleReply}
                                            onMoveToChat={handleMoveToChat}
                                            activeThreadId={activeThreadId}
                                        />
                                    )}
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
                            disabled={isLoading}
                        />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select or create a chat to start messaging.
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;