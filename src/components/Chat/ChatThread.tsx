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
    const isActive = node.message.id === activeThreadId;

    return (
        <div className="relative flex flex-col items-center mb-12">
            {level > 0 && (
                <div className="absolute -top-6 h-6 w-px bg-muted left-1/2 transform -translate-x-1/2 z-0" />
            )}

            <div className="relative z-10 px-4 w-full max-w-[700px]">
                <ChatMessageBubble
                    message={node.message}
                    onReply={() => onReply(node.message.id)}
                    highlight={isActive}
                />
            </div>

            {node.children.length > 0 && (
                <div className="mt-8 flex flex-row gap-6 flex-nowrap justify-center px-4">
                    {node.children.map((child) => (
                        <ThreadNode
                            key={child.message.id}
                            node={child}
                            level={level + 1}
                            onReply={onReply}
                            activeThreadId={activeThreadId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ChatThread: React.FC<ChatThreadProps> = ({ messages, onReply, activeThreadId }) => {
    const tree = buildMessageTree(messages);

    return (
        <div className="p-10">
            {tree.map((node) => (
                <ThreadNode
                    key={node.message.id}
                    node={node}
                    onReply={onReply}
                    activeThreadId={activeThreadId}
                />
            ))}
        </div>
    );
};

export default ChatThread;
