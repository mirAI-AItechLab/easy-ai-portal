import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  DEFAULT_VIDEO_MODEL,
  isVideoModelId,
} from "@/lib/ai-models";

export const runtime = "nodejs";
export const maxDuration = 600;

type AspectRatio = "16:9" | "9:16";
type VideoResolution = "720p" | "1080p";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAspectRatio(value: unknown): value is AspectRatio {
  return value === "16:9" || value === "9:16";
}

function isVideoResolution(value: unknown): value is VideoResolution {
  return value === "720p" || value === "1080p";
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API キーが未設定です。.env.localを確認してください。" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const requestedModel = typeof body.model === "string" ? body.model : "";
    const requestedAspectRatio = body.aspectRatio;
    const requestedResolution = body.resolution;

    if (!prompt) {
      return NextResponse.json(
        { error: "AIに送る内容を入力してください。" },
        { status: 400 }
      );
    }

    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: "AIに送る内容が長すぎます。4000文字以内で入力してください。" },
        { status: 400 }
      );
    }

    const model = isVideoModelId(requestedModel)
      ? requestedModel
      : DEFAULT_VIDEO_MODEL;

    const aspectRatio: AspectRatio = isAspectRatio(requestedAspectRatio)
      ? requestedAspectRatio
      : "16:9";

    const resolution: VideoResolution = isVideoResolution(requestedResolution)
      ? requestedResolution
      : "720p";

    const ai = new GoogleGenAI({ apiKey });

    console.log("Video request:", {
      model,
      aspectRatio,
      resolution,
      promptLength: prompt.length,
    });

    let operation = await ai.models.generateVideos({
      model,
      prompt,
      config: {
        aspectRatio,
        resolution,
      },
    });

    const timeoutMs = 8 * 60 * 1000;

    while (!operation.done) {
      console.log("Waiting for video generation...", {
        name: operation.name,
        done: operation.done,
      });

      if (Date.now() - startedAt > timeoutMs) {
        return NextResponse.json(
          {
            error:
              "動画生成がタイムアウトしました。Cloud Runのタイムアウト設定、またはVeo側の処理時間を確認してください。",
          },
          { status: 504 }
        );
      }

      await sleep(10_000);

      operation = await ai.operations.getVideosOperation({
        operation,
      });
    }

    console.log("Completed operation:", JSON.stringify(operation, null, 2));

    const generatedVideo = operation.response?.generatedVideos?.[0];

    if (!generatedVideo?.video) {
      console.error("Veo operation response:", JSON.stringify(operation, null, 2));

      return NextResponse.json(
        {
          error:
            "動画生成は完了しましたが、動画データがレスポンスに含まれていませんでした。",
        },
        { status: 502 }
      );
    }

    const videoUri = generatedVideo.video.uri;

    if (!videoUri) {
      console.error("Generated video has no URI:", generatedVideo);

      return NextResponse.json(
        {
          error:
            "動画生成は完了しましたが、動画URIがレスポンスに含まれていませんでした。",
        },
        { status: 502 }
      );
    }

    console.log("Downloading video from URI:", videoUri);

    /**
     * まずは x-goog-api-key ヘッダー方式で取得する
     */
    let downloadRes = await fetch(videoUri, {
      headers: {
        "x-goog-api-key": apiKey,
      },
    });

    /**
     * ヘッダー方式で失敗した場合、key= クエリパラメータ方式でも試す
     */
    if (!downloadRes.ok) {
      const firstErrorText = await downloadRes.text();

      console.error("Video download failed with header auth:", {
        status: downloadRes.status,
        statusText: downloadRes.statusText,
        body: firstErrorText,
      });

      const separator = videoUri.includes("?") ? "&" : "?";
      const downloadUrl = `${videoUri}${separator}key=${apiKey}`;

      console.log("Retrying video download with key query param...");

      downloadRes = await fetch(downloadUrl);

      if (!downloadRes.ok) {
        const secondErrorText = await downloadRes.text();

        console.error("Video download failed with query key:", {
          status: downloadRes.status,
          statusText: downloadRes.statusText,
          body: secondErrorText,
        });

        return NextResponse.json(
          {
            error: `動画生成は完了しましたが、動画ファイルの取得に失敗しました。status=${downloadRes.status}`,
            detail: secondErrorText,
          },
          { status: 502 }
        );
      }
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);
    const videoUrl = `data:video/mp4;base64,${videoBuffer.toString("base64")}`;

    return NextResponse.json({
      videoUrl,
      model,
      aspectRatio,
      resolution,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error: unknown) {
    console.error("Video generation error:", error);

    let message = "動画生成中にエラーが発生しました。";

    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}