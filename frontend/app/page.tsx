"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const API_BASE_URL = "http://127.0.0.1:8001";

export default function LifeOS() {
  // Capture Zone State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Chat Interface State
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSaveNote = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    setSaveMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMessage(`✅ Saved seamlessly to ${data.file}!`);
        setTitle("");
        setContent("");
      } else {
        setSaveMessage("❌ Error saving note.");
      }
    } catch (e) {
      console.error(e);
      setSaveMessage("❌ Failed to connect to local brain.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 5000);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isChatting) return;

    const userMessage = query.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setQuery("");
    setIsChatting(true);

    // Placeholder for assistant response to stream into
    setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const newMsgs = [...prev];
            const lastIndex = newMsgs.length - 1;
            const lastMessage = newMsgs[lastIndex];

            newMsgs[lastIndex] = {
              ...lastMessage,
              text: `${lastMessage.text}${chunk}`,
            };

            return newMsgs;
          });
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].text = "⚠️ Connection to local Llama3 failed.";
        return newMsgs;
      });
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <header className="mb-8 border-b border-neutral-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Private Second Brain
          </h1>
          <p className="text-neutral-500 text-sm mt-1">100% Local. Zero Cloud. Life OS.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Engine Online port 8001</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
        {/* Left Pane: Capture Zone */}
        <Card className="flex flex-col bg-neutral-900/50 border-neutral-800 backdrop-blur-sm shadow-2xl overflow-hidden rounded-xl">
          <div className="p-5 border-b border-neutral-800 bg-black/40">
            <h2 className="text-lg font-semibold text-neutral-200">Capture Thoughts</h2>
          </div>
          <div className="p-5 flex-1 flex flex-col space-y-4">
            <Input
              placeholder="Note Title (e.g., My thoughts on AI)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black/50 border-neutral-700 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
            />
            <Textarea
              placeholder="Write anything in Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none bg-black/50 border-neutral-700 text-gray-200 placeholder:text-neutral-600 focus-visible:ring-emerald-500 font-mono text-sm leading-relaxed"
            />
          </div>
          <div className="p-5 border-t border-neutral-800 bg-black/40 flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-400 h-5">
              {saveMessage}
            </p>
            <Button
              onClick={handleSaveNote}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 shadow-lg shadow-emerald-900/20"
            >
              {isSaving ? "Saving..." : "Save to Vault"}
            </Button>
          </div>
        </Card>

        {/* Right Pane: Chat Interface */}
        <Card className="flex flex-col bg-neutral-900/50 border-neutral-800 backdrop-blur-sm shadow-2xl overflow-hidden rounded-xl">
          <div className="p-5 border-b border-neutral-800 bg-black/40">
            <h2 className="text-lg font-semibold text-neutral-200">Local AI Assistant</h2>
          </div>

          <ScrollArea className="flex-1 p-5 space-y-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-4 py-20">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain text-neutral-700">
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                  <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
                  <path d="M17.599 6.5A3 3 0 0 0 10.38 6" />
                  <path d="M10.38 6A3 3 0 0 0 6.5 10.38" />
                  <path d="M6.5 10.38A3 3 0 0 0 9 16m8.62-5.62A3 3 0 0 1 15 16" />
                </svg>
                <p>Hello. I have access to your vault.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3 ${msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-neutral-800 text-gray-200 border border-neutral-700"
                        }`}
                    >
                      {msg.role === "user" ? (
                        <p>{msg.text}</p>
                      ) : (
                        <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border border-neutral-700 prose-pre:p-4 rounded-xl text-sm">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-neutral-800 bg-black/40">
            <form onSubmit={handleChatSubmit} className="flex space-x-3">
              <Input
                placeholder="Ask your second brain..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-black/50 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:ring-blue-500 rounded-full px-5"
                disabled={isChatting}
              />
              <Button
                type="submit"
                disabled={!query.trim() || isChatting}
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 rounded-full px-6"
              >
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
