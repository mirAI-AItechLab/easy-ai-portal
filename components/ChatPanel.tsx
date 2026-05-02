"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHAT_MODELS,
  DEFAULT_CHAT_MODEL,
} from "@/lib/ai-models";

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

const CHAT_STORAGE_KEY = "easy-ai-portal-chat-messages";

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedChatModel, setSelectedChatModel] = useState(DEFAULT_CHAT_MODEL);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatMeta, setChatMeta] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);

    if (!savedMessages) {
      return;
    }

    try {
      const parsed = JSON.parse(savedMessages);

      if (!Array.isArray(parsed)) {
        return;
      }

      const validMessages = parsed.filter(
        (message): message is ChatMessage =>
          typeof message === "object" &&
          message !== null &&
          (message.role === "user" || message.role === "model") &&
          typeof message.text === "string"
      );

      setMessages(validMessages);
    } catch (error) {
      console.error("Failed to restore chat messages:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  async function handleSendMessage() {
    const trimmedInput = chatInput.trim();

    if (!trimmedInput || isChatLoading) {
      return;
    }

    setChatError("");
    setChatMeta("");

    const userMessage: ChatMessage = {
      role: "user",
      text: trimmedInput,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedChatModel,
          messages: nextMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setChatError(data.error || "AI応答の生成に失敗しました。");
        return;
      }

      const modelMessage: ChatMessage = {
        role: "model",
        text: data.text || "",
      };

      setMessages((currentMessages) => [...currentMessages, modelMessage]);

      if (data.model && data.latencyMs !== undefined) {
        setChatMeta(`${data.model} / ${data.latencyMs}ms`);
      }
    } catch (error) {
      console.error(error);
      setChatError("通信エラーが発生しました。");
    } finally {
      setIsChatLoading(false);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setChatInput("");
    setChatError("");
    setChatMeta("");
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-300">AIチャット</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            会話履歴つきチャット
          </h2>
        </div>

        <button
          type="button"
          onClick={handleNewChat}
          className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          新規チャット
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-200">AIモデル</p>
          <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs text-cyan-300">
            Select Model
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {CHAT_MODELS.map((model) => {
            const isActive = selectedChatModel === model.id;

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedChatModel(model.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-white/5 hover:border-cyan-300/50 hover:bg-white/10"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">
                    {model.name}
                  </span>

                  {"badge" in model && model.badge ? (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                      {model.badge}
                    </span>
                  ) : null}
                </div>

                {"description" in model && model.description ? (
                  <p className="text-xs leading-relaxed text-slate-400">
                    {model.description}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm leading-relaxed text-slate-500">
            まだ会話はありません。
            <br />
            メッセージを送ると、ここに履歴が表示されます。
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? "bg-cyan-400 text-slate-950"
                        : "border border-white/10 bg-white/5 text-slate-100"
                    }`}
                  >
                    <p className="mb-1 text-xs opacity-70">
                      {isUser ? "You" : "AI"}
                    </p>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              );
            })}

            {isChatLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                  AIが回答を生成中...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {chatMeta && (
        <p className="text-xs text-slate-500">{chatMeta}</p>
      )}

      {chatError && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {chatError}
        </div>
      )}

      <div className="space-y-3">
        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="メッセージを入力してください。Ctrl + Enter で送信できます。"
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
        />

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={isChatLoading || !chatInput.trim()}
          className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isChatLoading ? "生成中..." : "送信"}
        </button>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        会話履歴はこのブラウザの localStorage に保存されます。
        ページを更新しても残りますが、別端末や別ブラウザには共有されません。
      </p>
    </div>
  );
}