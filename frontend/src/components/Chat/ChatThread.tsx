import { buildMessageTree } from "@/utils/tree";
import type { ChatMessage, ThreadedMessageNode } from "@/types";
import PairedMessageNode from "./PairedMessageNode";

interface ChatThreadProps {
    messages: ChatMessage[];
    onReply: (id: string) => void;
    onMoveToChat: (id: string) => void;
    activeThreadId: string | null;
}

const ThreadNode: React.FC<{
    node: ThreadedMessageNode;
    activePathIds: Set<string>;
    onReply: (id: string) => void;
    onMoveToChat: (id: string) => void;
}> = ({ node, activePathIds, onReply, onMoveToChat }) => {
    if (!node || !node.message) {
        return null;
    }

    if (node.message.role !== 'user') {
        return null;
    }

    const assistantChildNode = node.children.find(
        (child) => child.message.role === 'assistant'
    );

    const branchingChildren = assistantChildNode
        ? assistantChildNode.children
        : node.children.filter(child => child.message.role !== 'assistant');

    return (
        <li>
            <div className="w-full max-w-md">
                <PairedMessageNode
                    userMessage={node.message}
                    assistantMessage={assistantChildNode?.message}
                    highlight={activePathIds.has(node.message.id) || (assistantChildNode && activePathIds.has(assistantChildNode.message.id))}
                    onReply={assistantChildNode ? () => onReply(assistantChildNode.message.id) : undefined}
                    onMoveToChat={() => onMoveToChat(node.message.id)}
                />
            </div>

            {branchingChildren.length > 0 && (
                <ul>
                    {branchingChildren.map((child) => (
                        <ThreadNode
                            key={child.message.id}
                            node={child}
                            activePathIds={activePathIds}
                            onReply={onReply}
                            onMoveToChat={onMoveToChat}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

const findAncestry = (
    node: ThreadedMessageNode,
    targetId: string
): string[] | null => {
    if (!node || !node.message) return null;
    if (node.message.id === targetId) return [node.message.id];
    for (const child of node.children) {
        const path = findAncestry(child, targetId);
        if (path) return [node.message.id, ...path];
    }
    return null;
};

const ChatThreadView: React.FC<ChatThreadProps> = ({ messages, onReply, activeThreadId, onMoveToChat }) => {
    const tree = buildMessageTree(messages || []);
    const activePathIds = new Set(tree.flatMap((node) => findAncestry(node, activeThreadId ?? "") ?? []));

    return (
        <div className="p-10 text-center whitespace-nowrap overflow-x-auto">
            <ul className="chat-tree">
                {tree.map((node, index) => (
                    <ThreadNode
                        key={node?.message?.id || index}
                        node={node}
                        onReply={onReply}
                        onMoveToChat={onMoveToChat}
                        activePathIds={activePathIds}
                    />
                ))}
            </ul>
        </div>
    );
};

export default ChatThreadView;
