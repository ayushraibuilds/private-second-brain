import { FormEvent, KeyboardEvent, RefObject, useEffect, useRef } from "react";
import { BookOpenText, BrainCircuit, LoaderCircle, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

import type { ChatMessage } from "./types";

type ChatInterfaceProps = {
  query: string;
  messages: ChatMessage[];
  isChatting: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
  onQueryChange: (value: string) => void;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
  onClearChat: () => void;
};

export function ChatInterface({
  query,
  messages,
  isChatting,
  bottomRef,
  onQueryChange,
  onSubmit,
  onClearChat,
}: ChatInterfaceProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 5 * 24 + 24);
    textarea.style.height = `${nextHeight}px`;
  }, [query]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <Card className="relative flex min-h-[72vh] flex-col overflow-hidden rounded-[1.75rem] border border-sky-500/10 bg-gradient-to-b from-sky-500/8 via-zinc-950 to-zinc-950 text-zinc-100 shadow-[0_30px_120px_-60px_rgba(56,189,248,0.55)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />
      <CardHeader className="border-b border-zinc-800/80 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-sky-300/75">
              <BrainCircuit className="size-3.5" />
              Second Brain Chat
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-50">
              Ask against your own vault.
            </CardTitle>
            <CardDescription className="max-w-xl text-sm leading-6 text-zinc-400">
              Responses stream in real time and carry note citations when retrieval finds
              supporting context.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClearChat}
              disabled={!messages.length}
              className="h-9 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            >
              <Trash2 className="size-4" />
              Clear Chat
            </Button>
            <div className="hidden rounded-full border border-sky-400/15 bg-sky-400/10 px-3 py-1 text-xs text-sky-200 sm:flex sm:items-center sm:gap-2">
              {isChatting ? <LoaderCircle className="size-3.5 animate-spin" /> : <BookOpenText className="size-3.5" />}
              {isChatting ? "Streaming" : "Context-aware"}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 px-6 py-6">
        <ScrollArea className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950/80">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[26rem] flex-col items-center justify-center gap-4 px-8 py-16 text-center text-zinc-500">
              <BrainCircuit className="size-12 text-zinc-700" />
              <div className="space-y-2">
                <p className="text-base font-medium text-zinc-300">Vault-aware chat is ready.</p>
                <p className="max-w-md text-sm leading-6">
                  Ask about saved notes, project decisions, routines, or summarize anything
                  already living in the local vault.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl border px-4 py-3 shadow-lg shadow-black/10 sm:max-w-[85%] ${
                      message.role === "user"
                        ? "border-sky-400/30 bg-sky-500 text-zinc-950"
                        : "border-zinc-800 bg-zinc-900/90 text-zinc-100"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <>
                        <div className="prose prose-invert prose-zinc max-w-none text-sm leading-7 prose-headings:text-zinc-50 prose-p:text-zinc-200 prose-a:text-sky-300 prose-strong:text-zinc-50 prose-code:text-zinc-100 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:border prose-pre:border-zinc-800 prose-pre:bg-black/50">
                          <ReactMarkdown>
                            {message.text || (message.status === "streaming" ? "Thinking..." : "")}
                          </ReactMarkdown>
                        </div>
                        {message.sources?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
                            {message.sources.map((source) => (
                              <span
                                key={`${message.id}-${source}`}
                                className="rounded-full border border-sky-400/15 bg-sky-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-sky-200"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-7">{message.text}</p>
                    )}
                  </div>
                </article>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        <form
          onSubmit={(event) => onSubmit(event)}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Textarea
            ref={textareaRef}
            placeholder="Ask your second brain..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={1}
            className="max-h-[8.5rem] min-h-11 flex-1 resize-none rounded-xl border-zinc-800 bg-zinc-950/70 px-4 py-3 text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-sky-400/30"
            disabled={isChatting}
          />
          <Button
            type="submit"
            disabled={!query.trim() || isChatting}
            className="h-11 rounded-xl bg-sky-500 px-5 text-zinc-950 hover:bg-sky-400"
          >
            {isChatting ? "Streaming..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
