import React, { useState } from "react";
import { useChat } from "@/hooks/useChat"; // <-- Import the new hook

import ChatThreadView from "@/components/Chat/ChatThread";
import MessageInput from "@/components/Chat/MessageInput";
import { SettingsDialog } from "@/components/Chat/SettingsDialog";

const App: React.FC = () => {
    // All chat logic and state is now managed by the useChat hook.
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
            <div className="w-64 border-r p-4 flex flex-col gap-2">
                <button onClick={() => setShowSettings(true)}>⚙️ Settings</button>
                {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}

                <button onClick={handleNewChat} disabled={isLoading}>
                    + New Chat
                </button>

                {threads?.length > 0 ? (
                    threads.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleSetCurrentThreadId(t.id)}
                            disabled={isLoading}
                            className={currentThreadId === t.id ? 'font-bold' : ''}
                        >
                            {t.title === "New Thread" ? `Chat ${t.id.slice(4, 8)}` : t.title}
                        </button>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No threads yet.</p>
                )}
            </div>

            {/* --- Main Content UI --- */}
            <div className="flex flex-col flex-1">
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
            </div>
        </div>
    );
};

export default App;