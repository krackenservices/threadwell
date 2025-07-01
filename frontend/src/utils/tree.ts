import type { ChatMessage, ThreadedMessageNode } from "@/types";

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
        const parentId = msg.parent_id;

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

export function buildAncestryChain(messages: ChatMessage[], fromId: string): ChatMessage[] {
    const map = new Map(messages.map((m) => [m.id, m]));
    const chain: ChatMessage[] = [];

    let current = map.get(fromId);
    while (current) {
        chain.unshift(current);
        current = current.parent_id ? map.get(current.parent_id) : undefined;
    }

    return chain;
}

function findLeaf(node: ThreadedMessageNode): ThreadedMessageNode {
    let currentNode = node;
    // The children are sorted by timestamp in buildMessageTree, so index 0 is always the leftmost direct child.
    while (currentNode.children && currentNode.children.length > 0) {
        currentNode = currentNode.children[0];
    }
    return currentNode;
}

export function findDefaultParent(messages: ChatMessage[]): ChatMessage | null {
    if (!messages || messages.length === 0) return null;
    const roots = buildMessageTree(messages);
    if (roots.length === 0) return null;

    // Get the latest root message node
    const lastRoot = roots[roots.length - 1];

    // If the latest root has children (branches)
    if (lastRoot.children && lastRoot.children.length > 0) {
        // The default branch is the leftmost one, which is the first child because they are sorted by timestamp.
        const leftMostBranchStartNode = lastRoot.children[0];
        // Find the last message (the leaf) in this branch.
        const defaultParentNode = findLeaf(leftMostBranchStartNode);
        return defaultParentNode.message;
    }

    return null;
}
