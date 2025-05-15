import React from "react";
import {
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar.tsx";
import {Button} from "@/components/ui/button.tsx";
import {createThread} from "@/api.ts";
import type {ChatThread} from "@/types.ts";

type AppSidebarProps = {
    onNewThreadCreated: (thread: ChatThread) => void;
};

export const AppSidebar: React.FC<AppSidebarProps> = ({ onNewThreadCreated }) => {
    const handleNewChat = async () => {
        const newThread = await createThread();
        onNewThreadCreated(newThread);
    };
    return (
        <>
            <Button type="button" onClick={handleNewChat}>+ New Chat</Button>
            <SidebarGroup>
                <SidebarGroupLabel>Chats</SidebarGroupLabel>
            </SidebarGroup>
        </>
    );
};