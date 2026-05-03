import Link from "next/link";
import { ImageGenerator } from "@/components/ImageGenerator";

export default function ImagePage() {
    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5x1">
                <div className="mb-8">
                    <Link 
                    href="/"
                    className="mb-4 inline-flex text-sm text-slate-400 transition hover:text-white"
                    >
                        ←トップに戻る
                    </Link>

                    <div className="rounded-3x1 border border-white/10 bg-white/5 p-6 shadow-2x1">
                    <p className="mb-2 text-sm text-fuchsia-300">画像生成</p>
                    <h1 className="text-3x1 font-bold tracking-tight sm:text-4x1">
                        プロンプトから画像を生成
                    </h1>
                    <p className="mt-3 max-w-2x1 text-sm leading-relaxed text-slate-400">
                        Geminiの画像生成モデルを使って、Webサイト素材、コンセプトビジュアル、SNS用画像などを生成できます。
                    </p>
                    </div>
                </div>

                <div className="rounded-3x1 border border-white/10 bg-slate-900/80 p-5 shadow-2x1">
                <ImageGenerator />
                </div>
            </div>
        </main>
);
}