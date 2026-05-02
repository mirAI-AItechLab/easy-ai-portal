"use client";

import { useState } from "react";
import { 
    DEFAULT_VIDEO_MODEL,
    VIDEO_MODELS,
} from "@/lib/ai-models";

type AcpectRatio = "16:9" | "9:16";
type VideoResolution = "720p" | "1080p";

export function VideoGenerator() {
    const [videoPrompt, setVideoPrompt] = useState("");
    const [selectedVideoModel, setSelectedVideoModel] = useState(DEFAULT_VIDEO_MODEL);
    const [aspectRatios, setAspectRatios] = useState<AcpectRatio>("16:9");
    const [resolution, setResolution] = useState<VideoResolution>("720p");

    const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
    const [videoMeta, setVideoMeta] = useState("");
    const [videoError, setVideoError] = useState("");
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

    async function handleVideoGenerate() {
        try {
            setIsGeneratingVideo(true);
            setVideoError("");
            setGeneratedVideoUrl("");
            setVideoMeta("");

            const res = await fetch("/api/video", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: videoPrompt,
                    model: selectedVideoModel,
                    aspectRatios,
                    resolution,
                }),
            });

            const data = await res.json();
            console.log("video response:", data);

            if (!res.ok) {
                setVideoError(data.error || "動画生成に失敗しました。");
                return;
            }  

            if (!data.videoUrl) {
                setVideoError("動画URLがAPIから返ってきていません。/api/video のレスポンスを確認してください。");
                return;
            }   

            setGeneratedVideoUrl(data.videoUrl);

            if (data.model && data.latencyMs !== undefined) {
                setVideoMeta(`${data.model} / ${data.AcpectRatio} / ${data.resolution} / ${data.latencyMs}ms`);
            }
        } catch (error) {
            console.error(error);
            setVideoError("通信エラーが発生しました。");
        } finally {
            setIsGeneratingVideo(false);
        }
    }

    return (
        <div className="space-y-5">
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-200">動画生成モデル</p>
                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs text-cyan-300">
                    Video Model
                    </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                    {VIDEO_MODELS.map((model) => {
                        const isActive = selectedVideoModel === model.id;

                        return (
                            <button
                            key={model.id}
                            type="button"
                            onClick={() => setSelectedVideoModel(model.id)}
                            className={`rounded-2xl border px-4 py-3 text-left transition ${
                                isActive ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                                : "border-white/10 bg-white/5 hover:border-cyan-300/50 hover:bg-white/10"
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

            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                        アスペクト比
                    </label>

                    <select
                        value={aspectRatios}
                        onChange={(e) => setAspectRatios(e.target.value as AcpectRatio)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
                    >
                        <option className="bg-slate-900" value="16:9">
                            16:9 (横長)
                        </option>
                        <option className="bg-slate-900" value="9:16">
                            9:16 (縦長)
                        </option>
                    </select>
               </div>

               <div>
                <label className="mb-2 block text-sm font-mideum text-slate-200">
                    解像度
                </label>

                <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as VideoResolution)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
                >
                    <option className="bg-slate-900" value="720p">
                        720p
                    </option>
                    <option className="bg-slate-900" value="1080p">
                        1080p
                    </option>
                </select>
               </div>
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                    動画生成プロンプト
                </label>

                <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="例：夜の峠道を走る黒いスポーツカー。雨上がりの路面にネオンが反射し、カメラは低い位置から車を追いかける。 cinematic, dramatic lighting, high speed."
                    className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
                />
                </div>

                <button
                    type="button"
                    onClick={handleVideoGenerate}
                    disabled={isGeneratingVideo || !videoPrompt.trim()}
                    className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isGeneratingVideo ? "動画生成中...数分かかる場合があります。" : "動画生成"}
                </button>
                    {videoError && (
                        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                            {videoError}
                        </div>
                    )}

                    {generatedVideoUrl && (
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-slate-200">生成結果</p>
                                {videoMeta && (
                                    <span className="text-xs text-slate-400">{videoMeta}</span>
                                    )}
                            </div>

                            <video
                                src={generatedVideoUrl}
                                controls
                                playsInline
                                className="w-full rounded-2xl border border-white/10"
                            />
                        </div>
                    )}
            </div>
        );
    }