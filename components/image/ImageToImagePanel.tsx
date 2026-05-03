"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ImageEditMessage, ImageSession } from "@/lib/image-session-types";
import {
  createImageSession,
  loadCurrentImageSessionId,
  loadImageSessions,
  saveCurrentImageSessionId,
  saveImageSessions,
} from "@/lib/image-session-storage";
import {
  getImageAsset,
  saveImageAsset,
} from "@/lib/image-asset-db";
import {
  blobToDataUrl,
  dataUrlToBase64,
  dataUrlToBlob,
  getImageSize,
} from "@/lib/image-utils";

type ImagePreviewMap = Record<string, string>;

const DEFAULT_MODEL = "gemini-2.5-flash-image";

export default function ImagePage() {
  const [sessions, setSessions] = useState<ImageSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [previews, setPreviews] = useState<ImagePreviewMap>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSession = useMemo(() => {
    return sessions.find((session) => session.id === currentSessionId) ?? null;
  }, [sessions, currentSessionId]);

  useEffect(() => {
    const loadedSessions = loadImageSessions();
    const savedCurrentId = loadCurrentImageSessionId();

    if (loadedSessions.length > 0) {
      setSessions(loadedSessions);

      const validCurrentId =
        savedCurrentId &&
        loadedSessions.some((session) => session.id === savedCurrentId)
          ? savedCurrentId
          : loadedSessions[0].id;

      setCurrentSessionId(validCurrentId);
      saveCurrentImageSessionId(validCurrentId);
    } else {
      const newSession = createImageSession({
        model: DEFAULT_MODEL,
        mode: "img2img",
      });

      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
      saveImageSessions([newSession]);
      saveCurrentImageSessionId(newSession.id);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      saveImageSessions(sessions);
    }
  }, [sessions]);

  useEffect(() => {
    if (currentSessionId) {
      saveCurrentImageSessionId(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    async function loadPreviews() {
      if (!currentSession) return;

      const imageIds = new Set<string>();

      for (const id of currentSession.referenceImageIds) {
        imageIds.add(id);
      }

      if (currentSession.currentImageId) {
        imageIds.add(currentSession.currentImageId);
      }

      for (const message of currentSession.messages) {
        for (const id of message.imageIds ?? []) {
          imageIds.add(id);
        }
      }

      const nextPreviews: ImagePreviewMap = {};

      for (const id of imageIds) {
        const asset = await getImageAsset(id);
        if (!asset) continue;

        nextPreviews[id] = await blobToDataUrl(asset.blob);
      }

      setPreviews(nextPreviews);
    }

    loadPreviews();
  }, [currentSession]);

  function updateCurrentSession(updater: (session: ImageSession) => ImageSession) {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId ? updater(session) : session
      )
    );
  }

  function handleCreateNewSession() {
    const newSession = createImageSession({
      model: DEFAULT_MODEL,
      mode: "img2img",
    });

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }

  async function handleUploadReferenceImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError(null);

    const file = event.target.files?.[0];
    if (!file || !currentSession) return;

    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }

    const id = crypto.randomUUID();
    const size = await getImageSize(file);

    await saveImageAsset({
      id,
      sessionId: currentSession.id,
      kind: "reference",
      mimeType: file.type,
      blob: file,
      width: size.width,
      height: size.height,
    });

    const dataUrl = await blobToDataUrl(file);

    setPreviews((prev) => ({
      ...prev,
      [id]: dataUrl,
    }));

    updateCurrentSession((session) => ({
      ...session,
      mode: "img2img",
      referenceImageIds: [id],
      currentImageId: id,
      updatedAt: new Date().toISOString(),
    }));

    event.target.value = "";
  }

  async function handleGenerateEdit() {
    if (!currentSession) return;

    setError(null);

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("修正内容を入力してください。");
      return;
    }

    const sourceImageId =
      currentSession.currentImageId ?? currentSession.referenceImageIds[0];

    if (!sourceImageId) {
      setError("先にリファレンス画像をアップロードしてください。");
      return;
    }

    const sourceAsset = await getImageAsset(sourceImageId);

    if (!sourceAsset) {
      setError("編集対象の画像が見つかりません。画像を再アップロードしてください。");
      return;
    }

    const sourceDataUrl = await blobToDataUrl(sourceAsset.blob);
    const sourceBase64 = dataUrlToBase64(sourceDataUrl);

    const userMessage: ImageEditMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmedPrompt,
      imageIds: [sourceImageId],
      createdAt: new Date().toISOString(),
    };

    updateCurrentSession((session) => ({
      ...session,
      messages: [...session.messages, userMessage],
      updatedAt: new Date().toISOString(),
    }));

    setPrompt("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/image/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: currentSession.model,
          prompt: trimmedPrompt,
          images: [
            {
              mimeType: sourceBase64.mimeType,
              base64: sourceBase64.base64,
            },
          ],
          history: currentSession.messages
            .slice(-6)
            .map((message) => ({
              role: message.role,
              text: message.text,
            })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "画像編集に失敗しました。");
      }

      const generatedDataUrl = `data:${result.image.mimeType};base64,${result.image.base64}`;
      const generatedBlob = await dataUrlToBlob(generatedDataUrl);
      const generatedImageId = crypto.randomUUID();
      const size = await getImageSize(generatedBlob);

      await saveImageAsset({
        id: generatedImageId,
        sessionId: currentSession.id,
        kind: "generated",
        mimeType: result.image.mimeType,
        blob: generatedBlob,
        width: size.width,
        height: size.height,
      });

      setPreviews((prev) => ({
        ...prev,
        [generatedImageId]: generatedDataUrl,
      }));

      const modelMessage: ImageEditMessage = {
        id: crypto.randomUUID(),
        role: "model",
        text: result.text ?? "画像を生成しました。",
        imageIds: [generatedImageId],
        createdAt: new Date().toISOString(),
      };

      updateCurrentSession((session) => ({
        ...session,
        messages: [...session.messages, modelMessage],
        currentImageId: generatedImageId,
        title:
          session.title === "新しい画像編集"
            ? trimmedPrompt.slice(0, 24)
            : session.title,
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "画像編集中にエラーが発生しました。"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleUseImageAsCurrent(imageId: string) {
    updateCurrentSession((session) => ({
      ...session,
      currentImageId: imageId,
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleClearCurrentSession() {
    if (!currentSession) return;

    updateCurrentSession((session) => ({
      ...session,
      messages: [],
      currentImageId: session.referenceImageIds[0],
      updatedAt: new Date().toISOString(),
    }));
  }

  if (!currentSession) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p>読み込み中...</p>
      </main>
    );
  }

  const currentImageUrl =
    currentSession.currentImageId &&
    previews[currentSession.currentImageId]
      ? previews[currentSession.currentImageId]
      : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
                                      <Link 
                    href="/"
                    className="mb-4 inline-flex text-sm text-slate-400 transition hover:text-white"
                    >
                        ←トップに戻る
                    </Link>


          <p className="text-sm text-gray-500">Image to Image</p>
          <h1 className="text-2xl font-bold">画像編集</h1>
          <p className="mt-2 text-sm text-gray-600">
            リファレンス画像をアップロードし、対話形式で修正できます。
            履歴はこのブラウザ内に一時保存されます。
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNewSession}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-700/40"
        >
          新しい編集を開始
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-semibold">編集セッション</h2>

          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setCurrentSessionId(session.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  session.id === currentSessionId
                    ? "border-black bg-slate-700"
                    : "hover:bg-slate-700/40"
                }`}
              >
                <div className="font-medium">{session.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(session.updatedAt).toLocaleString("ja-JP")}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border bg-slate-900 p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold">リファレンス画像</h2>
                <p className="text-sm text-gray-500">
                  最初の画像、または直近の生成画像をもとに再編集します。
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-2 text-sm text-white">
                画像をアップロード
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadReferenceImage}
                  className="hidden"
                />
              </label>
            </div>

            {currentImageUrl ? (
              <div className="overflow-hidden rounded-2xl border bg-slate-700/40">
                <img
                  src={currentImageUrl}
                  alt="現在の編集対象"
                  className="max-h-[520px] w-full object-contain"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-gray-500">
                画像をアップロードしてください。
              </div>
            )}

            {currentSession.referenceImageIds.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {currentSession.referenceImageIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleUseImageAsCurrent(id)}
                    className="rounded-xl border p-1 hover:bg-slate-700/40"
                  >
                    {previews[id] && (
                      <img
                        src={previews[id]}
                        alt="reference"
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">編集履歴</h2>
                <p className="text-sm text-gray-500">
                  生成画像をクリックすると、その画像から再編集できます。
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearCurrentSession}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-700/40"
              >
                履歴クリア
              </button>
            </div>

            <div className="space-y-4">
              {currentSession.messages.length === 0 ? (
                <div className="rounded-2xl bg-slate-700/40 p-6 text-center text-sm text-gray-500">
                  まだ編集履歴はありません。
                </div>
              ) : (
                currentSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[86%] rounded-2xl p-3 ${
                        message.role === "user"
                          ? "bg-black text-white"
                          : "bg-slate-700 text-gray-900"
                      }`}
                    >
                      {message.text && (
                        <p className="whitespace-pre-wrap text-sm">
                          {message.text}
                        </p>
                      )}

                      {message.imageIds && message.imageIds.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.imageIds.map((imageId) =>
                            previews[imageId] ? (
                              <button
                                key={imageId}
                                type="button"
                                onClick={() => handleUseImageAsCurrent(imageId)}
                                className="overflow-hidden rounded-xl border bg-slate-900"
                              >
                                <img
                                  src={previews[imageId]}
                                  alt="生成画像"
                                  className="h-40 w-40 object-cover"
                                />
                              </button>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sticky bottom-4 rounded-2xl border bg-slate-900 p-4 shadow-lg">
            {error && (
              <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 md:flex-row">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例：この画像の背景を夜景にして、人物の雰囲気はそのままにしてください"
                className="min-h-24 flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
              />

              <button
                type="button"
                onClick={handleGenerateEdit}
                disabled={isGenerating}
                className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? "生成中..." : "修正を生成"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}