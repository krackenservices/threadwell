import { buildMessageTree } from "@/utils/tree";
import type { ChatMessage, ThreadedMessageNode } from "@/types";
import ChatMessageBubble from "@/components/Chat/ChatMessage";

interface ChatThreadProps {
    messages: ChatMessage[];
    onReply: (id: string) => void;
    activeThreadId: string | null;
}

const ThreadNode: React.FC<{
    node: ThreadedMessageNode;
    level?: number;
    onReply: (id: string) => void;
    activeThreadId: string | null;
}> = ({ node, level = 0, onReply, activeThreadId }) => {
    const isInActivePath = node.message.id === activeThreadId;

    return (
        <div className="relative flex flex-col items-center mb-12">
            {/* Connector from parent */}
            {level > 0 && (
                <div className="absolute -top-6 h-6 w-px bg-muted left-1/2 transform -translate-x-1/2 z-0" />
            )}

            {/* Message bubble */}
            <div className="relative z-10 px-4 w-full max-w-[600px]">
                <ChatMessageBubble
                    message={node.message}
                    onReply={() => onReply(node.message.id)}
                    showThreadId={isInActivePath}
                    highlight={isInActivePath}
                />
            </div>

            {/* Children horizontally */}
            {node.children.length > 0 && (
                <div className="mt-8 flex flex-row justify-center gap-6 overflow-x-auto px-4 w-full relative z-0">
                    {node.children.map((child) => (
                        <div
                            key={child.message.id}
                            className="relative flex flex-col items-center min-w-[320px] max-w-[600px]"
                        >
                            {/* Connector to child */}
                            <div className="absolute -top-6 h-6 w-px bg-muted left-1/2 transform -translate-x-1/2" />
                            <ThreadNode
                                node={child}
                                level={level + 1}
                                onReply={onReply}
                                activeThreadId={activeThreadId}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ChatThread: React.FC<ChatThreadProps> = ({ messages, onReply, activeThreadId }) => {
    const tree = buildMessageTree(messages);

    return (
        <div className="w-full flex justify-center overflow-y-auto max-h-[calc(100vh-10rem)]">
            <div className="p-6 w-full max-w-[1280px]">
                {tree.map((node) => (
                    <ThreadNode
                        key={node.message.id}
                        node={node}
                        onReply={onReply}
                        activeThreadId={activeThreadId}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChatThread;
