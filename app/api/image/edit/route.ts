import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

type EditImageRequest = {
  model?: string;
  prompt?: string;
  images?: {
    mimeType: string;
    base64: string;
  }[];
  history?: {
    role: "user" | "model";
    text?: string;
  }[];
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EditImageRequest;

    const prompt = body.prompt?.trim();
    const model = body.model || "gemini-3.1-flash-image-preview";

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
          { error: "Google API キーが未設定です。.env.localを確認してください。" },
          { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "修正内容を入力してください。" },
        { status: 400 }
      );
    }

    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        { error: "編集対象の画像がありません。" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY が設定されていません。" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const safeHistoryText =
      body.history
        ?.slice(-6)
        .map((message) => {
          const speaker = message.role === "user" ? "ユーザー" : "AI";
          return `${speaker}: ${message.text ?? ""}`;
        })
        .join("\n") ?? "";

    const parts = [
      ...body.images.map((image) => ({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64,
        },
      })),
      {
        text: `
あなたは画像編集アシスタントです。
入力画像をもとに、ユーザーの修正内容を反映した画像を生成してください。

過去の編集文脈:
${safeHistoryText || "なし"}

今回の修正内容:
${prompt}

注意:
- 元画像の主要な被写体や構図はなるべく維持してください。
- 指示されていない部分は不要に変更しないでください。
- 最終的な画像を出力してください。
        `.trim(),
      },
    ];

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    let text = "";
    let generatedImage:
      | {
          mimeType: string;
          base64: string;
        }
      | undefined;

    const candidates = response.candidates ?? [];

    for (const candidate of candidates) {
      const responseParts = candidate.content?.parts ?? [];

      for (const part of responseParts) {
        if ("text" in part && part.text) {
          text += part.text;
        }

        if ("inlineData" in part && part.inlineData?.data) {
          generatedImage = {
            mimeType: part.inlineData.mimeType ?? "image/png",
            base64: part.inlineData.data,
          };
        }
      }
    }

    if (!generatedImage) {
      return NextResponse.json(
        {
          error: "画像が生成されませんでした。",
          text,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      text: text || "画像を生成しました。",
      image: generatedImage,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "画像編集中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}