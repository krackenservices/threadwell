import React, { useState, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
    onSend: (text: string) => void;
    replyingTo: string | null;
    cancelReply: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
                                                       onSend,
                                                       replyingTo,
                                                       cancelReply,
                                                   }) => {
    const [text, setText] = useState("");

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setText("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col gap-2 p-4 border-t border-border bg-background">
            {replyingTo && (
                <div className="text-sm text-muted-foreground flex justify-between mb-1">
          <span>
            Replying to <code>{replyingTo.slice(0, 6)}</code>
          </span>
                    <button className="underline" onClick={cancelReply}>
                        Cancel
                    </button>
                </div>
            )}
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                className="resize-none min-h-[60px]"
            />
            <div className="flex justify-end">
                <Button onClick={handleSend}>Send</Button>
            </div>
        </div>
    );
};

export default MessageInput;
