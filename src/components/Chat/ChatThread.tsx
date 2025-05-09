import { buildMessageTree } from "@/utils/tree";
import type { ChatMessage, ThreadedMessageNode } from "@/types";
import ChatMessageBubble from "@/components/Chat/ChatMessage";

interface ChatThreadProps {
    messages: ChatMessage[];
    onReply: (id: string) => void;
}

const ThreadNode: React.FC<{
    node: ThreadedMessageNode;
    level?: number;
    onReply: (id: string) => void;
}> = ({ node, level = 0, onReply }) => {
    return (
        <div className="relative flex flex-col items-center mb-12">
            {/* Vertical line from parent */}
            {level > 0 && (
                <div className="absolute -top-6 h-6 w-px bg-muted left-1/2 transform -translate-x-1/2 z-0" />
            )}

            {/* Chat bubble */}
            <div className="relative z-10 px-4 w-full max-w-[600px]">
                <ChatMessageBubble
                    message={node.message}
                    onReply={() => onReply(node.message.id)}
                />
            </div>

            {/* Children horizontally spaced */}
            {node.children.length > 0 && (
                <div className="mt-6 flex flex-row gap-8 px-4 w-full overflow-x-auto justify-center relative z-0">
                    {node.children.map((child) => (
                        <div
                            key={child.message.id}
                            className="relative flex flex-col items-center min-w-[320px] max-w-[600px]"
                        >
                            {/* Vertical connector line to this child */}
                            <div className="absolute -top-6 h-6 w-px bg-muted left-1/2 transform -translate-x-1/2" />
                            <ThreadNode node={child} level={level + 1} onReply={onReply} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ChatThread: React.FC<ChatThreadProps> = ({ messages, onReply }) => {
    const tree = buildMessageTree(messages);

    return (
        <div className="w-full flex justify-center overflow-y-auto max-h-[calc(100vh-10rem)]">
            <div className="p-6 w-full max-w-[1280px]">
                {tree.map((node) => (
                    <ThreadNode key={node.message.id} node={node} onReply={onReply} />
                ))}
            </div>
        </div>
    );
};

export default ChatThread;
