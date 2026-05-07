import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GoogleAuth } from "google-auth-library";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
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

function createSafeFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const random = randomUUID();

  return `videos/${timestamp}-${random}.mp4`;
}

async function uploadVideoBufferToGCS(params: {
  bucketName: string;
  objectName: string;
  videoBuffer: Buffer;
}) {
  const { bucketName, objectName, videoBuffer } = params;

  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/devstorage.read_write"],
  });

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();
  const accessToken = accessTokenResponse.token;

  if (!accessToken) {
    throw new Error("Cloud Storage upload用のアクセストークンを取得できませんでした。");
  }

  const uploadUrl =
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucketName)}/o` +
    `?uploadType=media&name=${encodeURIComponent(objectName)}`;

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "video/mp4",
    },
    body: new Uint8Array(videoBuffer),
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();

    console.error("Cloud Storage REST upload failed:", {
      status: uploadRes.status,
      statusText: uploadRes.statusText,
      body: errorText,
    });

    throw new Error(
      `Cloud Storageへのアップロードに失敗しました。status=${uploadRes.status}`
    );
  }

  return await uploadRes.json();
}

async function createSignedVideoUrl(params: {
  bucketName: string;
  objectName: string;
}) {
  const { bucketName, objectName } = params;

  const storage = new Storage();
  const file = storage.bucket(bucketName).file(objectName);

  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 1000 * 60 * 60, // 1時間
  });

  return signedUrl;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const bucketName = process.env.GCS_VIDEO_BUCKET;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API キーが未設定です。.env.localを確認してください。" },
        { status: 500 }
      );
    }

    if (!bucketName) {
      return NextResponse.json(
        { error: "GCS_VIDEO_BUCKET が未設定です。" },
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
        { error: "動画生成プロンプトを入力してください。" },
        { status: 400 }
      );
    }

    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: "プロンプトが長すぎます。4000文字以内で入力してください。" },
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

    if (operation.error) {
      console.error("Veo operation error:", JSON.stringify(operation.error, null, 2));

      return NextResponse.json(
        {
          error: "動画生成は完了しましたが、Veo側でエラーが返されました。",
          detail: operation.error,
        },
        { status: 502 }
      );
    }

    const generatedVideo = operation.response?.generatedVideos?.[0];

    if (!generatedVideo?.video?.uri) {
      console.error("No video URI in operation response:", JSON.stringify(operation, null, 2));

      return NextResponse.json(
        {
          error:
            "動画生成は完了しましたが、動画URIがレスポンスに含まれていませんでした。",
        },
        { status: 502 }
      );
    }

    const videoUri = generatedVideo.video.uri;

    console.log("Downloading video from URI:", videoUri);

    let downloadRes = await fetch(videoUri, {
      headers: {
        "x-goog-api-key": apiKey,
      },
    });

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

    console.log("Downloaded video size:", {
      bytes: videoBuffer.length,
      mb: (videoBuffer.length / 1024 / 1024).toFixed(2),
    });

    const objectName = createSafeFileName();

    console.log("Uploading video to Cloud Storage via REST API:", {
      bucket: bucketName,
      objectName,
      bytes: videoBuffer.length,
    });

    await uploadVideoBufferToGCS({
      bucketName,
      objectName,
      videoBuffer,
    });

    console.log("Uploaded video to Cloud Storage:", {
      bucket: bucketName,
      objectName,
    });

    console.log("Creating signed URL:", {
      bucket: bucketName,
      objectName,
    });

    const videoUrl = await createSignedVideoUrl({
      bucketName,
      objectName,
    });

    console.log("Created signed URL");

    return NextResponse.json({
      videoUrl,
      storagePath: `gs://${bucketName}/${objectName}`,
      model,
      aspectRatio,
      resolution,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error: unknown) {
    console.error("Video generation error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "動画生成中にエラーが発生しました。";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}