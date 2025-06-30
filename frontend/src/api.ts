import type { ChatMessage, ChatThread, Settings } from "@/types";
import { API_BASE} from "@/config.ts";

// THREADS
export const getThreads = () =>
    fetchJson<ChatThread[]>("/api/threads");

export const createThread = () =>
    fetchJson<ChatThread>("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Thread" }),
    });

export const updateThread = (id: string, title: string) =>
    fetchJson<ChatThread>(`/api/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    });

export const deleteThread = (id: string) =>
    fetchJson<void>(`/api/threads/${id}`, { method: "DELETE" });

// MESSAGES

export const getMessages = (threadId: string) =>
    fetchJson<ChatMessage[]>(`/api/messages?threadId=${threadId}`);

export const getMessage = (id: string) =>
    fetchJson<ChatMessage>(`/api/messages/${id}`);

export const createMessage = (msg: Partial<ChatMessage>) =>
    fetchJson<ChatMessage>("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
    });

export const updateMessage = (id: string, msg: Partial<ChatMessage>) =>
    fetchJson<ChatMessage>(`/api/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
    });

export const deleteMessage = (id: string) =>
    fetchJson<void>(`/api/messages/${id}`, { method: "DELETE" });

// BRANCHING

interface MoveResponse {
    thread_id: string;
}

export const moveSubtree = async (fromMessageId: string): Promise<string> => {
    const { thread_id } = await fetchJson<MoveResponse>(`/api/move/${fromMessageId}`, {
        method: "POST",
    });
    return thread_id;
};

// UTIL

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(API_BASE + url, options);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    try {
        const text = await res.text();
        return JSON.parse(text);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (   err) {
        throw new Error(`Invalid JSON response from ${url}`);
    }

}

// SETTINGS

export async function getSettings(): Promise<Settings> {
    return fetchJson("/api/settings");
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
    return fetchJson("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
    });
}