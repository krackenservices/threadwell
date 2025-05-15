import React from "react";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
    message: ChatMessage;
    onReply?: () => void;
    highlight?: boolean;
    onMoveToChat?: (id: string) => void;
    isLeaf?: boolean;
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
                                                            onMoveToChat
                                                       }) => {
    const roleClass = roleColors[message.role] || "bg-gray-700 text-white";

    return (
        <div className="w-full my-4">
            <div className="relative w-full">
                <Card className={`min-w-[400px] w-fit rounded-xl shadow relative ${roleClass} ${highlight ? "bg-zinc-900 border-l-4 border-purple-400" : ""}`}>
                    {/* Thread Info pinned top-right and right-aligned */}
                    <CardHeader className="flex justify-end px-4 pt-3 text-xs text-muted-foreground italic">
                        <div className="text-right">
                            <div>Root: {message.root_id?.slice(0, 6) ?? "None"}</div>
                            {message.parent_id && (
                                <div>↳ {message.parent_id.slice(0, 6)}</div>
                            )}
                        </div>
                    </CardHeader>
                    {/* Padding on top to avoid overlap */}
                    <CardContent className="pt-14 pb-4 px-6 prose prose-invert max-w-full">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </CardContent>
                    <CardFooter>
                        {onReply && message.role !== "user" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onReply}
                            >
                                Reply
                            </Button>
                        )}
                        {onMoveToChat && message.role === "user" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMoveToChat(message.id)}
                            >
                                Move to Chat
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ChatMessageBubble;
