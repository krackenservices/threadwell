import { buildMessageTree } from "@/utils/tree";
import type { ChatMessage, ThreadedMessageNode } from "@/types";
import ChatMessageBubble from "@/components/Chat/ChatMessage";

interface ChatThreadProps {
    messages: ChatMessage[];
    onReply: (id: string) => void;
    onMoveToChat: (id: string) => void;
    activeThreadId: string | null;
}

const ThreadNode: React.FC<{
    node: ThreadedMessageNode;
    level?: number;
    onReply: (id: string) => void;
    activeThreadId: string | null;
    activePathIds: Set<string>;
    onMoveToChat: (id: string) => void;
}> = ({ node, level = 0, onReply, activeThreadId, activePathIds, onMoveToChat }) => {
    return (
        <div className="relative flex flex-col items-center mb-12">
            {level > 0 && (
                <div className="absolute -top-6 h-6 w-px bg-muted left-1/2 transform -translate-x-1/2 z-0" />
            )}

            <div className="relative z-10 px-4 w-full max-w-[700px]">
                <ChatMessageBubble
                    message={node.message}
                    onReply={() => onReply(node.message.id)}
                    onMoveToChat={onMoveToChat}
                    highlight={activePathIds.has(node.message.id)}
                    isLeaf={node.children.length === 0}
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
                            onMoveToChat={onMoveToChat}
                            activeThreadId={activeThreadId}
                            activePathIds={activePathIds}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const findAncestry = (
    node: ThreadedMessageNode,
    targetId: string
): string[] | null => {
    if (node.message.id === targetId) return [node.message.id];
    for (const child of node.children) {
        const path = findAncestry(child, targetId);
        if (path) return [node.message.id, ...path];
    }
    return null;
};

const ChatThread: React.FC<ChatThreadProps> = ({ messages, onReply, activeThreadId, onMoveToChat }) => {
    const tree = buildMessageTree(messages);

    const activePathIds = tree.flatMap((node) => findAncestry(node, activeThreadId ?? "") ?? []);

    return (
        <div className="p-10">
            {tree.map((node) => (
                <ThreadNode
                    key={node.message.id}
                    node={node}
                    onReply={onReply}
                    onMoveToChat={onMoveToChat}
                    activeThreadId={activeThreadId}
                    activePathIds={new Set(activePathIds)}
                />
            ))}
        </div>
    );
};

export default ChatThread;
