import { buildMessageTree } from "@/utils/tree";
import type { ChatMessage, ThreadedMessageNode } from "@/types";
import ChatMessageBubble from "@/components/Chat/ChatMessage";

interface ChatThreadProps {
    messages: ChatMessage[];
    onReply: (id: string) => void;
}

const INDENT_STEPS = [0, 4, 8, 12, 16, 20, 24]; // Tailwind spacing

const ThreadNode: React.FC<{
    node: ThreadedMessageNode;
    level?: number;
    onReply: (id: string) => void;
}> = ({ node, level = 0, onReply }) => {
    const indent = INDENT_STEPS[Math.min(level, INDENT_STEPS.length - 1)];

    return (
        <div className={`pl-${indent} mb-2`}>
            <ChatMessageBubble
                message={node.message}
                onReply={() => onReply(node.message.id)}
            />
            {node.children.length > 0 && (
                <div className="flex flex-row gap-4 mt-2 pl-2 border-l border-muted">
                    {node.children.map((child) => (
                        <div key={child.message.id} className="flex-1 min-w-[200px]">
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
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {tree.map((node) => (
                <ThreadNode key={node.message.id} node={node} onReply={onReply} />
            ))}
        </div>
    );
};

export default ChatThread;
