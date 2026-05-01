import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { 
    DEFAULT_IMAGE_MODEL,
    isImageModelId,
} from "@/lib/ai-models";
import { image } from "motion/react-client";

export const runtime = "nodejs";

type ImageRequest = {
    prompt?: string;
    model?: string;
};

type GeminiPart = {
    text?: string
    inlineData?: {
        data?: string;
        mimeType?: string;
    };
};

export async function POST(request: NextRequest) {
    try {
        const body: ImageRequest = await request.json();

        const prompt = body.prompt;
        const requestedModel = body.model;

        if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
            return NextResponse.json(
                { error: "画像生成に使うプロンプトを入力してください。" },
                { status: 400 }
            );
        }

        if (requestedModel && !isImageModelId(requestedModel)) {
            return NextResponse.json(
                { error: "未対応のAIモデルです。" },
                { status: 400 }
            );
        }

        const selectedModel = requestedModel ?? DEFAULT_IMAGE_MODEL;

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
            config: {
                responseModalities: ["Image"],
            },
        });

        const parts = (
            result.candidates?.[0]?.content?.parts as GeminiPart[] | undefined) ?? [];

        const imagePart = parts.find((part) => part.inlineData?.data);
        const textPart = parts.find((part) => part.text);

        const inlineData = imagePart?.inlineData;

        if (!inlineData?.data) {
            return NextResponse.json(
                { error: textPart?.text ||
                    "画像が生成されませんでした。プロンプトを変えて再試行してください。", },
                { status: 500 }
        );
        }

        const mimeType = inlineData.mimeType ?? "image/png";
        const base64 = inlineData.data;
        const latencyMs = Date.now() - startedAt;

        return NextResponse.json({
            imageUrl: `data:${mimeType};base64,${base64}`,            
            text: textPart?.text ?? "",
            model: selectedModel,
            latencyMs,
        });
    } catch (error) {
        console.error("image api error:", error);

        return NextResponse.json(
            {
                error:
                    "画像生成の生成に失敗しました。APIキー、モデル名、利用制限、プロンプト内容を確認してください。",
            },
            { status: 500 }
        );
    }
}