"use client";

import { useState } from "react";
import TextToImagePanel from "@/components/image/TextToImagePanel";
import ImageToImagePanel from "@/components/image/ImageToImagePanel";

export default function ImagePage() {
  const [mode, setMode] = useState<"text2img" | "img2img">("text2img");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Google系生成AI 簡易テストポータル</p>
            <h1 className="text-2xl font-bold text-white">画像生成 / 画像編集</h1>
            <p className="mt-2 text-sm text-slate-300">
              テキストから画像生成、またはリファレンス画像を使った画像編集ができます。
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("text2img")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === "text2img"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "border border-slate-600 bg-slate-800 text-slate-200 hover:border-amber-400 hover:text-amber-300"
            }`}
          >
            Text2Img
          </button>

          <button
            type="button"
            onClick={() => setMode("img2img")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === "img2img"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "border border-slate-600 bg-slate-800 text-slate-200 hover:border-amber-400 hover:text-amber-300"
            }`}
          >
            Img2Img
          </button>
        </div>

        {mode === "text2img" ? <TextToImagePanel /> : <ImageToImagePanel />}
      </div>
    </main>
  );
}