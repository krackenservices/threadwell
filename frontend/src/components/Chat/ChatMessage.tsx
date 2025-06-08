import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";
import { User, Bot, GitFork, Reply } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
    message: ChatMessage;
    onReply?: () => void;
    highlight?: boolean;
    onMoveToChat?: (id: string) => void;
    isLeaf?: boolean;
}

const roleStyles: Record<ChatMessage["role"], { bubble: string, avatar: string }> = {
    user: {
        bubble: "bg-primary/10 border-primary/20",
        avatar: "bg-primary/20 text-primary",
    },
    assistant: {
        bubble: "bg-card",
        avatar: "bg-muted",
    },
    system: {
        bubble: "bg-yellow-900/50 border-yellow-700/50",
        avatar: "bg-yellow-800",
    },
};

const RoleAvatar: React.FC<{ role: ChatMessage["role"] }> = ({ role }) => {
    const Icon = role === "user" ? User : Bot;
    return (
        <div className={cn(
            "size-8 rounded-full flex items-center justify-center flex-shrink-0",
            roleStyles[role].avatar
        )}>
            <Icon size={18} />
        </div>
    );
};


const ChatMessageBubble: React.FC<ChatMessageProps> = ({
                                                           message,
                                                           onReply,
                                                           highlight = false,
                                                           onMoveToChat,
                                                       }) => {
    const styles = roleStyles[message.role] || roleStyles.assistant;

    return (
        <div className="group w-full my-4 flex items-start gap-4">
            <RoleAvatar role={message.role} />

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
    );
};

export default ChatMessageBubble;