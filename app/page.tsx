"use client";
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL, } from "@/lib/ai-models";
import { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ImageIcon, Video, MessageSquareText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CHAT_MODELS, DEFAULT_CHAT_MODEL } from "@/lib/ai-models";

type ChatResponse = {
  text?: string;
  model?: string;
  latencyMs?: number;
  error?: string;
};

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [meta, setMeta] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  //画像生成系state//
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedImageModel, setSelectedImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [generatedImageUrl, setGenerateImageUrl] = useState("");
  const [imageMeta, setImageMeta] = useState("");
  const [imageError, setImageError] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  async function handleSend() {
    setLoading(true);
    setAnswer("");
    setMeta("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model: selectModel,
        }),
      });

      const data = (await res.json()) as ChatResponse;

      if (!res.ok) {
        setAnswer(data.error || "エラーが発生しました。");
        return;
      }

      setAnswer(data.text || "応答が空でした。");

      if (data.model && data.latencyMs !== undefined) {
        setMeta(`${data.model} / ${data.latencyMs}ms`);
      }
    } catch {
      setAnswer("通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

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

      if (!res.ok) {
        setImageError(data.error || "画像生成に失敗しました。");
        return;
      }

      setGenerateImageUrl(data.imageurl);

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
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-100px] top-40 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/3 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur">
              <Sparkles className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm text-cyan-300">NeuroRing</p>
              <h1 className="text-lg font-semibold tracking-tight">
                Google系生成AI 簡易テストポータル
              </h1>
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            MVP v0.1
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Card className="border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
              <CardContent className="space-y-5 p-5 sm:p-6">

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-slate-300">AIチャット</p>
                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">
                      Gemini
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-200">AIモデル</p>
                      <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs text-cyan-300">
                        Select Model
                      </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {CHAT_MODELS.map((model) => {
                      const isActive = selectModel === model.id;

                      return (
                        <button
                        key={model.id}
                        type="button"
                        onClick={() => setSelectedModel(model.id)}
                        className={`rounded-2x1 border px-4 py-3 text-left transition ${
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

                  <Textarea
                    placeholder="例：石川から東京へ出張する際の交通費について教えてください。車は○○で、燃費は○○km/l、フルで高速を使用します。"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-40 resize-none border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
                  />
                </div>

                <Button
                  onClick={handleSend}
                  disabled={loading}
                  className="h-12 w-full rounded-xl text-base"
                >
                  {loading ? "生成中..." : "生成"}
                </Button>

                {answer && (
                  <div className="space-y-2">
                    {meta && <p className="text-xs text-slate-400">{meta}</p>}
                    <div className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm leading-7 text-slate-100">
                      {answer}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="space-y-4"
          >
            <Card className="border-white/10 bg-white/5 text-white backdrop-blur-xl">
              <CardContent className="p-5">
                <p className="mb-3 text-sm text-slate-300">Available Modes</p>
                <div className="grid gap-3">
                  <ModeCard
                    icon={<MessageSquareText className="h-5 w-5" />}
                    title="AI Chat"
                    desc="文章作成・相談・要約・コード補助"
                    active
                  />
                  <Link 
                  href="/image"
                  className="block rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                  >
                  <ModeCard
                    icon={<ImageIcon className="h-5 w-5" />}
                    title="画像生成"
                    desc="最新のNano Bananaを使って画像を生成"
                  />
                  </Link>
                  <Link href="/video">
                  <ModeCard
                    icon={<Video className="h-5 w-5" />}
                    title="動画生成"
                    desc="最新のVeo3.1で動画を生成"
                  />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-cyan-300/20 bg-cyan-300/10 text-white backdrop-blur-xl">
              <CardContent className="space-y-2 p-5 text-sm text-slate-200">
                <p className="font-medium text-cyan-100">利用上の注意</p>
                <p>個人情報・機密情報は入力しないでください。</p>
                <p>生成結果は必ずしも正確ではありません。</p>
                <p>動画生成はクレジットを多く消費するため後で制限します。</p>
              </CardContent>
            </Card>
          </motion.aside>
        </section>
      </div>
    </main>
  );
}

function ModeCard({
  icon,
  title,
  desc,
  active = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        active
          ? "border-cyan-300/30 bg-cyan-300/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 ${
            active ? "text-cyan-200" : "text-slate-400"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}