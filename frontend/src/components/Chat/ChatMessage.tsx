import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";
import { GitFork, Reply } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
    message: ChatMessage;
    onReply?: () => void;
    highlight?: boolean;
    onMoveToChat?: (id: string) => void;
    isLeaf?: boolean;
}

const roleStyles: Record<ChatMessage["role"], { bubble: string, name: string }> = {
    user: {
        bubble: "bg-primary/10 border-primary/20",
        name: "text-primary",
    },
    assistant: {
        bubble: "bg-card",
        name: "text-muted-foreground",
    },
    system: {
        bubble: "bg-yellow-900/50 border-yellow-700/50",
        name: "text-yellow-500",
    },
};

const ChatMessageBubble: React.FC<ChatMessageProps> = ({
                                                           message,
                                                           onReply,
                                                           highlight = false,
                                                           onMoveToChat,
                                                       }) => {
    const styles = roleStyles[message.role] || roleStyles.assistant;
    const authorName = message.role.charAt(0).toUpperCase() + message.role.slice(1);


    return (
        <div className="group w-full flex flex-col items-start gap-1">
             <span className={cn("text-sm font-semibold ml-2", styles.name)}>
                {authorName}
            </span>
            <div className="flex items-start gap-2 w-full">
                <div className="flex-1">
                    <Card className={cn("rounded-xl shadow relative", styles.bubble, highlight && "ring-2 ring-accent")}>
                        <CardContent className="p-4 prose prose-invert max-w-full">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </CardContent>
                    </Card>
                </div>

                {/* Hover Actions */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onReply && message.role === "assistant" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onReply}
                            title="Reply to this message"
                        >
                            <Reply className="size-4" />
                        </Button>
                    )}
                    {onMoveToChat && message.role === "user" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onMoveToChat(message.id)}
                            title="Move this message to a new chat"
                        >
                            <GitFork className="size-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessageBubble;
