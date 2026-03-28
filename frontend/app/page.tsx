"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Database, HardDriveDownload, NotebookTabs } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/life-os/note-editor";
import { ChatInterface } from "@/components/life-os/chat-interface";
import { ToastStack } from "@/components/life-os/toast-stack";
import type { ChatMessage, Toast } from "@/components/life-os/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const NOTE_DRAFT_STORAGE_KEY = "life-os-note-draft";
const CHAT_HISTORY_STORAGE_KEY = "life-os-chat-history";

type MobilePane = "capture" | "chat";
type HealthStatus = "checking" | "online" | "offline";

type StreamEvent =
  | { type: "status"; message: string }
  | { type: "sources"; sources: string[] }
  | { type: "token"; token: string }
  | { type: "done" };

function createToast(title: string, tone: Toast["tone"], description?: string): Toast {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    tone,
  };
}

function createMessage(message: Omit<ChatMessage, "id">): ChatMessage {
  return {
    id: crypto.randomUUID(),
    ...message,
  };
}

function parseStreamPayload(payload: string): StreamEvent | null {
  try {
    return JSON.parse(payload) as StreamEvent;
  } catch {
    return null;
  }
}

export default function LifeOSPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("capture");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(NOTE_DRAFT_STORAGE_KEY);
      const savedHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);

      if (savedDraft) {
        const draft = JSON.parse(savedDraft) as { title?: string; content?: string };
        setTitle(draft.title ?? "");
        setContent(draft.content ?? "");
      }

      if (savedHistory) {
        const history = JSON.parse(savedHistory) as ChatMessage[];
        setMessages(Array.isArray(history) ? history : []);
      }
    } catch (error) {
      console.error("Failed to restore local state", error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    localStorage.setItem(
      NOTE_DRAFT_STORAGE_KEY,
      JSON.stringify({
        title,
        content,
      }),
    );
  }, [title, content, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages.slice(-20)));
  }, [messages, hasHydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isChatting]);

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((entry) => entry.id !== toast.id));
      }, 3500),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  useEffect(() => {
    let isMounted = true;

    const pollHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }

        const payload = (await response.json()) as {
          status?: string;
          engine?: string;
        };

        if (isMounted) {
          setHealthStatus(
            payload.status === "ok" && payload.engine === "online"
              ? "online"
              : "offline",
          );
        }
      } catch {
        if (isMounted) {
          setHealthStatus("offline");
        }
      }
    };

    void pollHealth();
    const intervalId = window.setInterval(() => {
      void pollHealth();
    }, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const pushToast = (toast: Toast) => {
    setToasts((current) => [...current, toast]);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
        }),
      });

      const payload = (await response.json()) as {
        file?: string;
        chunks_embedded?: number;
      };

      if (!response.ok) {
        throw new Error("The local vault refused the save request.");
      }

      setTitle("");
      setContent("");
      pushToast(
        createToast(
          "Note saved to local vault",
          "success",
          `${payload.file ?? "Untitled note"} embedded in ${payload.chunks_embedded ?? 0} chunk(s).`,
        ),
      );
    } catch (error) {
      console.error(error);
      pushToast(
        createToast(
          "Save failed",
          "error",
          error instanceof Error ? error.message : "Unexpected local save error.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChatSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const prompt = query.trim();
    if (!prompt || isChatting) {
      return;
    }

    const assistantId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      createMessage({ role: "user", text: prompt, status: "complete" }),
      {
        id: assistantId,
        role: "assistant",
        text: "",
        sources: [],
        status: "streaming",
      },
    ]);
    setQuery("");
    setIsChatting(true);
    setMobilePane("chat");

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: prompt }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Streaming response body is missing.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        let boundaryIndex = buffer.indexOf("\n\n");
        while (boundaryIndex !== -1) {
          const rawEvent = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);

          const payload = rawEvent
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart())
            .join("\n");

          const eventPayload = parseStreamPayload(payload);

          if (eventPayload?.type === "sources") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, sources: eventPayload.sources }
                  : message,
              ),
            );
          }

          if (eventPayload?.type === "status") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, agentStatus: eventPayload.message }
                  : message,
              ),
            );
          }

          if (eventPayload?.type === "token") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, text: `${message.text}${eventPayload.token}` }
                  : message,
              ),
            );
          }

          if (eventPayload?.type === "done") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, status: "complete" }
                  : message,
              ),
            );
          }

          boundaryIndex = buffer.indexOf("\n\n");
        }

        if (done) {
          break;
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text:
                  "I couldn't complete that request against the local model.\n\nCheck that FastAPI and Ollama are both running, then try again.",
                status: "error",
              }
            : message,
        ),
      );
      pushToast(
        createToast(
          "Chat failed",
          "error",
          error instanceof Error ? error.message : "Unexpected local chat error.",
        ),
      );
    } finally {
      setIsChatting(false);
    }
  };

  const panes = [
    { id: "capture" as const, label: "Capture", icon: NotebookTabs },
    { id: "chat" as const, label: "Chat", icon: Bot },
  ];

  const healthBadge = {
    checking: {
      dot: "bg-amber-400",
      pulse: "",
      label: "Checking engine",
      text: "text-amber-100",
      border: "border-amber-400/15 bg-amber-400/10",
    },
    online: {
      dot: "bg-emerald-400",
      pulse: "animate-pulse",
      label: "Engine online",
      text: "text-emerald-100",
      border: "border-emerald-400/15 bg-emerald-400/10",
    },
    offline: {
      dot: "bg-rose-400",
      pulse: "",
      label: "Engine offline",
      text: "text-rose-100",
      border: "border-rose-400/15 bg-rose-400/10",
    },
  }[healthStatus];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <ToastStack toasts={toasts} />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_34%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 space-y-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
                  Private Second Brain
                </p>
                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                    Life OS
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                    Draft notes on the left, reason over your local vault on the right, and
                    keep everything fully offline.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
                    <Bot className="size-3.5" />
                    Model
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-100">llama3.2</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
                    <Database className="size-3.5" />
                    Embeddings
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-100">nomic-embed-text</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
                  <div className={`flex items-center gap-2 rounded-full px-2 py-1 text-xs uppercase tracking-[0.25em] ${healthBadge.border} ${healthBadge.text}`}>
                    <HardDriveDownload className="size-3.5" />
                    {healthBadge.label}
                  </div>
                  <p className="mt-2 flex items-center gap-2 truncate text-sm font-medium text-zinc-100">
                    <span className={`h-2.5 w-2.5 rounded-full ${healthBadge.dot} ${healthBadge.pulse}`} />
                    {API_BASE_URL}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-1 lg:hidden">
              {panes.map((pane) => {
                const Icon = pane.icon;
                const active = mobilePane === pane.id;

                return (
                  <Button
                    key={pane.id}
                    type="button"
                    onClick={() => setMobilePane(pane.id)}
                    variant={active ? "default" : "ghost"}
                    className={`flex-1 rounded-xl ${
                      active
                        ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    }`}
                  >
                    <Icon className="size-4" />
                    {pane.label}
                  </Button>
                );
              })}
            </div>
          </header>

          <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
            <div className={`${mobilePane === "capture" ? "block" : "hidden"} lg:block`}>
              <NoteEditor
                title={title}
                content={content}
                isSaving={isSaving}
                onTitleChange={setTitle}
                onContentChange={setContent}
                onSave={handleSave}
                onToast={pushToast}
              />
            </div>

            <div className={`${mobilePane === "chat" ? "block" : "hidden"} lg:block`}>
              <ChatInterface
                query={query}
                messages={messages}
                isChatting={isChatting}
                bottomRef={bottomRef}
                onQueryChange={setQuery}
                onSubmit={handleChatSubmit}
                onClearChat={() => setMessages([])}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
