import type { ChatMessage, ThreadedMessageNode } from "@/types";

export function buildMessageTree(messages: ChatMessage[]): ThreadedMessageNode[] {
    const messageMap = new Map<string, ThreadedMessageNode>();
    const roots: ThreadedMessageNode[] = [];

    // Initialize all nodes
    messages.forEach((msg) => {
        messageMap.set(msg.id, { message: msg, children: [] });
    });

    // Build tree
    messages.forEach((msg) => {
        const node = messageMap.get(msg.id)!;
        if (msg.parentId) {
            const parent = messageMap.get(msg.parentId);
            if (parent) {
                parent.children.push(node);
            } else {
                // Orphaned node: no valid parent
                roots.push(node);
            }
        } else {
            roots.push(node);
        }
    });

    return roots;
}
