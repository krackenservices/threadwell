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
        <div className="relative flex flex-col items-center mb-12 w-full max-w-full">
            {/* Connector from parent */}
            {level > 0 && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-px h-6 bg-muted" />
            )}

            {/* Message bubble centered */}
            <div className="w-full max-w-[600px] px-4">
                <ChatMessageBubble
                    message={node.message}
                    onReply={() => onReply(node.message.id)}
                />
            </div>

            {/* Children horizontally */}
            {node.children.length > 0 && (
                <div className="mt-8 flex flex-row justify-center gap-6 overflow-x-auto px-4 w-full">
                    {node.children.map((child) => (
                        <div
                            key={child.message.id}
                            className="relative flex flex-col items-center flex-1 min-w-[300px] max-w-[600px]"
                        >
                            {/* Connector line from parent to child */}
                            <div className="absolute -top-6 left-1/2 w-px h-6 bg-muted transform -translate-x-1/2" />
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
        <div className="w-full flex justify-center">
            <div className="p-6 max-w-[1024px] overflow-y-auto max-h-[calc(100vh-10rem)]">
                {tree.map((node) => (
                    <ThreadNode key={node.message.id} node={node} onReply={onReply} />
                ))}
            </div>
        </div>
    );
};

export default ChatThread;
