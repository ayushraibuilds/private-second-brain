import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { FilePenLine, FileUp, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { Toast } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type NoteEditorProps = {
  title: string;
  content: string;
  isSaving: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onToast: (toast: Toast) => void;
};

function createToast(
  title: string,
  tone: Toast["tone"],
  description?: string,
): Toast {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    tone,
  };
}

export function NoteEditor({
  title,
  content,
  isSaving,
  onTitleChange,
  onContentChange,
  onSave,
  onToast,
}: NoteEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSave();
    }
  };

  const handleUploadClick = () => {
    if (isUploading) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    onToast(
      createToast(
        "Uploading PDF",
        "info",
        `${file.name} is being chunked and embedded locally. This can take a few seconds.`,
      ),
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        file?: string;
        chunks?: number;
        detail?: string;
      };

      if (!response.ok) {
        throw new Error(payload.detail || "Failed to upload PDF.");
      }

      onToast(
        createToast(
          "PDF embedded successfully",
          "success",
          `${payload.file ?? file.name} indexed in ${payload.chunks ?? 0} chunk(s).`,
        ),
      );
    } catch (error) {
      onToast(
        createToast(
          "PDF upload failed",
          "error",
          error instanceof Error ? error.message : "Unexpected upload error.",
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="relative flex min-h-[72vh] flex-col overflow-hidden rounded-[1.75rem] border border-emerald-500/10 bg-gradient-to-b from-emerald-500/8 via-zinc-950 to-zinc-950 text-zinc-100 shadow-[0_30px_120px_-60px_rgba(16,185,129,0.55)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
      <CardHeader className="border-b border-zinc-800/80 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-emerald-300/75">
              <FilePenLine className="size-3.5" />
              Capture Zone
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-50">
              Shape raw notes into memory.
            </CardTitle>
            <CardDescription className="max-w-xl text-sm leading-6 text-zinc-400">
              Draft markdown, save it locally, or ingest a PDF into the same vault. Press{" "}
              <span className="font-medium text-zinc-300">Cmd/Ctrl + Enter</span> to save.
            </CardDescription>
          </div>
          <div className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200 sm:flex sm:items-center sm:gap-2">
            <Sparkles className="size-3.5" />
            Local-first drafting
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 px-6 py-6">
        <Input
          placeholder="Note title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="h-12 rounded-xl border-zinc-800 bg-zinc-950/70 px-4 text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-emerald-400/30"
        />
        <Textarea
          placeholder="Write in markdown..."
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          className="min-h-[26rem] flex-1 resize-none rounded-2xl border-zinc-800 bg-zinc-950/70 px-4 py-4 font-mono text-sm leading-7 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-emerald-400/30"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-zinc-500">
            Stored in the local vault and re-embedded into Chroma on save or upload.
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="h-11 w-11 rounded-xl border-zinc-800 bg-zinc-950/70 text-zinc-200 hover:bg-zinc-900"
              aria-label="Upload PDF"
              title="Upload PDF"
            >
              <FileUp className="size-4" />
            </Button>
            <Button
              onClick={onSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="h-11 rounded-xl bg-emerald-500 px-5 text-zinc-950 hover:bg-emerald-400"
            >
              {isSaving ? "Saving..." : "Save to Vault"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
