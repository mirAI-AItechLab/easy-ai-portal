import Link from "next/link";
import { VideoGenerator } from "@/components/VideoGenerator";
import { Video } from "lucide-react";

export default function VideoPage() {
    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <Link 
                    href="/"
                    className="mb-4 inline-flex text-sm text-slate-400 transition hover:text-white"
                    >
                    ←トップに戻る
                    </Link>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
                    <p className="mb-2 text-sm text-cyan-300">Video Generate</p>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        プロンプトから動画を生成
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                        Veo系の動画生成モデルを使って、短尺のコンセプトムービー、SNS用動画、プロダクト紹介素材などを生成できます。
                    </p>
                    </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl">
                <VideoGenerator />
                </div>
            </div>
        </main>
    );
}