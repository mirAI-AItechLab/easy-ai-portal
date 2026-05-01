import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  DEFAULT_CHAT_MODEL,
  isChatModelId,
} from "@/lib/ai-models";

export const runtime = "nodejs";

type ChatRequest = {
  prompt?: string;
  model?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    const prompt = body.prompt;
    const requestedModel = body.model;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "AIに送る内容を入力してください。" },
        { status: 400 }
      );
    }

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

    const startedAt = Date.now();

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
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