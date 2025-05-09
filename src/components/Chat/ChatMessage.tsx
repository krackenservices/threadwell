import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
    message: ChatMessage;
    onReply?: () => void;
    highlight?: boolean;
}

const roleColors: Record<ChatMessage["role"], string> = {
    user: "bg-blue-800 text-white",
    assistant: "bg-zinc-800 text-white",
    system: "bg-gray-600 text-white",
};

const ChatMessageBubble: React.FC<ChatMessageProps> = ({
                                                           message,
                                                           onReply,
                                                           highlight = false,
                                                       }) => {
    const roleClass = roleColors[message.role] || "bg-gray-700 text-white";

    return (
        <div className="w-full my-4">
            <div className="relative w-full">
                <Card
                    className={`w-full rounded-xl shadow relative ${roleClass} ${
                        highlight ? "ring-2 ring-accent" : ""
                    }`}
                >
                    {/* Thread Info pinned top-right and right-aligned */}
                    <div className="flex justify-end px-4 pt-3 text-xs text-muted-foreground italic">
                        <div className="text-right">
                            <div>Root: {message.rootId?.slice(0, 6) ?? "—"}</div>
                            {message.parentId && (
                                <div>↳ {message.parentId.slice(0, 6)}</div>
                            )}
                        </div>
                    </div>

                    {/* Padding on top to avoid overlap */}
                    <CardContent className="pt-14 pb-4 px-6 prose prose-invert max-w-full">
                        <ReactMarkdown>{message.content}</ReactMarkdown>

                        {onReply && message.role !== "user" && (
                            <Button
                                variant="link"
                                size="sm"
                                className="text-muted-foreground p-0 h-auto mt-2"
                                onClick={onReply}
                            >
                                Reply
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ChatMessageBubble;
