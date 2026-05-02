import { NextRequest, NextResponse } from "next/server";
import { Chat, GoogleGenAI } from "@google/genai";
import {
  DEFAULT_CHAT_MODEL,
  isChatModelId,
} from "@/lib/ai-models";

export const runtime = "nodejs";

type ChatMessage = {
    role: "user" | "model";
    text: string;
};

type ChatRequest = {
  prompt?: string;
  model?: string;
  messages?: ChatMessage[];
};

function isValidChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Partial<ChatMessage>;

  return (
    (message.role === "user" || message.role === "model") &&
    typeof message.text === "string" &&
    message.text.trim().length > 0
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    const prompt = body.prompt;
    const requestedModel = body.model;
    const requestedMessages = body.messages;

    if (requestedModel && !isChatModelId(requestedModel)) {
      return NextResponse.json(
        { error: "未対応のAIモデルです。" },
        { status: 400 }
      );
    }

    const selectedModel = requestedModel ?? DEFAULT_CHAT_MODEL;

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API キーが未設定です。.env.localを確認してください。" },
        { status: 500 }
      );
    }

    const messages = 
    Array.isArray(requestedMessages)
    ? requestedMessages.filter(isValidChatMessage)
    : [];

    const hasMessages = messages.length > 0;
    const hasPrompt = typeof prompt === "string" && prompt.trim().length > 0;

    if (!hasMessages && !hasPrompt) {
        return NextResponse.json(
            { error: "AIに送る内容を入力してください。" },
            { status: 400 }
        );
    }

    const startedAt = Date.now();

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: selectedModel,
      contents: hasMessages
      ? messages.map((message) => ({
        role: message.role,
        parts: [
            {
                text: message.text,
            },
        ],
      }))
      : prompt!.trim(),
    });

    const latencyMs = Date.now() - startedAt;

    return NextResponse.json({
      text: result.text || "",
      model: selectedModel,
      latencyMs,
    });
  } catch (error) {
    console.error("chat api error:", error);

    return NextResponse.json(
      {
        error:
          "AI応答の生成に失敗しました。APIキー、モデル名、またはリクエスト内容を確認してください。",
      },
      { status: 500 }
    );
  }
}