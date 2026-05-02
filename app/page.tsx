"use client";
import { motion } from "motion/react";
import { Sparkles, ImageIcon, Video, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChatPanel } from "@/components/ChatPanel";

type ChatResponse = {
  text?: string;
  model?: string;
  latencyMs?: number;
  error?: string;
};

export default function HomePage() {
  //画像生成系state//

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
          <CardContent className="p-5 sm:p-6">
            <ChatPanel />
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