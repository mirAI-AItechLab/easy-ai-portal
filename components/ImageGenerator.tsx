"use client";

import { useState } from "react";
import { 
    DEFAULT_IMAGE_MODEL,
    IMAGE_MODELS,
} from "@/lib/ai-models";

export function ImageGenerator() {
    const [imagePrompt, setImagePrompt] = useState("");
    const [selectedImageModel, setSelectedImageModel] = useState(DEFAULT_IMAGE_MODEL);
    const [generatedImageUrl, setGenerateImageUrl] = useState("");
    const [imageMeta, setImageMeta] = useState("");
    const [imageError, setImageError] = useState("");
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    async function handleImageGenerate() {
        try {
            setIsGeneratingImage(true);
            setImageError("");
            setGenerateImageUrl("");
            setImageMeta("");

            const res = await fetch("/api/image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: imagePrompt,
                    model: selectedImageModel,
                }),
            });

            const data = await res.json();
            console.log("image response:", data);

            if (!res.ok) {
                setImageError(data.error || "画像生成に失敗しました。");
                return;
            }

            setGenerateImageUrl(data.imageUrl);

            if (!data.imageUrl) {
                setImageError("画像URLがAPIから返ってきていません。/api/image のレスポンスを確認してください。");
                return;
            }

            if (data.model && data.latencyMs !== undefined) {
                setImageMeta(`${data.model} / ${data.latencyMs}ms`);
            }
        } catch (error) {
            console.error(error);
            setImageError("通信エラーが発生しました。");
        } finally {
            setIsGeneratingImage(false);
        }
    }

    return (
        <div className="space-y-5">
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-200">画像生成モデル</p>
                    <span className="rounded-full bg-fuchsia-400/10 px-2 py-1 text-xs text-fuchsia-300">
                    Image Model
                    </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                    {IMAGE_MODELS.map((model) => {
                        const isActive = selectedImageModel === model.id;

                        return (
                            <button
                            key={model.id}
                            type="button"
                            onClick={() => setSelectedImageModel(model.id)}
                            className={`rounded-2x1 border px-4 py-3 text-left transition ${
                                isActive ? "border-fuchsia-400 bg-fuchsia-400/10 shadow-[0_0_24px_rgba(217,70,239,0.18)]"
                                : "border-white/10 bg-white/5 hover:border-fuchsia-300/50 hover:bg-white/10"
                            }`}
                        >
                            <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-white">
                                {model.name}
                                </span>
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                                {model.badge}
                                </span>
                            </div>

                            <p className="text-xs leading-relaxed text-slate-400">
                                {model.description}
                            </p>
                        </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  画像生成プロンプト
                </label>

                <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="例：峠を走り回るAE86。ゴブリンが運転していて、助手席ドアに「ゴブリンレーシング」の文字が光っている。"
                    className="min-h-32 w-full rounded-2x1 border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-300"
                />
                </div>

                <button
                    type="button"
                    onClick={handleImageGenerate}
                    disabled={isGeneratingImage || !imagePrompt.trim()}
                    className="w-full rounded-2xl bg-fuchsia-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isGeneratingImage ? "画像生成中..." : "画像生成"}                
                </button>

                {imageError && (
                    <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                        {imageError}
                    </div>
                )}

                {generatedImageUrl && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-200">生成結果</p>
                            {imageMeta && (
                                <span className="text-xs text-slate-400">{imageMeta}</span>
                            )}
                        </div>

                        <img src={generatedImageUrl}
                        alt="Generated Image"
                        className="w-full rounded-2x1 border border-white/10"
                        />
                    </div>
                )}
            </div>
    );
}