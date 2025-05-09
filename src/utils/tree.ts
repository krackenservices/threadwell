import type { ChatMessage } from "@/types";

export interface ThreadedMessageNode {
    message: ChatMessage;
    children: ThreadedMessageNode[];
}

/**
 * Transforms a flat array of ChatMessage into a threaded tree structure.
 */
export function buildMessageTree(messages: ChatMessage[]): ThreadedMessageNode[] {
    const nodes = new Map<string, ThreadedMessageNode>();
    const roots: ThreadedMessageNode[] = [];

    // Step 1: Create node for each message
    for (const msg of messages) {
        nodes.set(msg.id, { message: msg, children: [] });
    }

    // Step 2: Link children to parents
    for (const msg of messages) {
        const node = nodes.get(msg.id)!;
        const parentId = msg.parentId;

        if (parentId && nodes.has(parentId)) {
            nodes.get(parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    // Step 3: Sort children by timestamp (optional but recommended)
    function sortTree(node: ThreadedMessageNode) {
        node.children.sort((a, b) => a.message.timestamp - b.message.timestamp);
        node.children.forEach(sortTree);
    }

    roots.sort((a, b) => a.message.timestamp - b.message.timestamp);
    roots.forEach(sortTree);

    return roots;
}
