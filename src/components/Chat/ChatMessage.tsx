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
        <div className="w-full my-2">
            <Card
                className={`rounded-xl shadow relative ${roleClass} ${
                    highlight ? "border-2 border-blue-500" : ""
                }`}
            >
                <div className="absolute top-1 right-2 text-xs text-muted-foreground italic">
                    Thread: {message.id.slice(0, 6)}
                </div>
                <CardContent className="p-4 prose prose-invert max-w-full">
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
    );
};

export default ChatMessageBubble;
