import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GitFork, Reply } from "lucide-react";

interface PairedMessageNodeProps {
    userMessage: ChatMessage;
    assistantMessage?: ChatMessage;
    onReply?: () => void;
    onMoveToChat?: () => void;
    highlight?: boolean;
}

const PairedMessageNode: React.FC<PairedMessageNodeProps> = ({
                                                                 userMessage,
                                                                 assistantMessage,
                                                                 onReply,
                                                                 onMoveToChat,
                                                                 highlight,
                                                             }) => {
    return (
        <div className="group relative">
            <Card className={cn("rounded-lg shadow-md bg-card", highlight && "bg-accent/20 ring-2 ring-accent-foreground/50")}>
                <CardContent className="p-0">
                    <div className="user-message p-3">
                        <p className="font-semibold text-xs text-primary">User</p>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{userMessage.content}</ReactMarkdown>
                        </div>
                    </div>
                    {assistantMessage && (
                        <div className="assistant-message p-3 border-t">
                            <p className="font-semibold text-xs text-green-600 dark:text-green-500">Assistant</p>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{assistantMessage.content}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* Hover Actions */}
            <div className="absolute top-1 right-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {onReply && assistantMessage && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onReply}
                        title="Reply to this message"
                    >
                        <Reply className="size-4" />
                    </Button>
                )}
                {onMoveToChat && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMoveToChat}
                        title="Move this message to a new chat"
                    >
                        <GitFork className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PairedMessageNode;