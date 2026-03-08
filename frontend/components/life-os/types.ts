export type ChatRole = "user" | "assistant";

export type MessageStatus = "streaming" | "complete" | "error";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  sources?: string[];
  status?: MessageStatus;
};

export type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: "success" | "error" | "info";
};
