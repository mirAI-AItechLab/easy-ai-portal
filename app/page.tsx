import { image } from "motion/react-client";
import Link from "next/link";

const modes = [
  {
    title: "チャット",
    description: "相談・文章作成・要約・コード補助",
    href: "/chat",
    label: "AI チャット",
    imageSrc: "/cards/chat.png"
  },
  {
    title: "画像生成",
    description: "テキスト→画像 / 画像編集",
    href: "/image",
    label: "画像生成 / 画像編集",
    imageSrc: "/cards/image.png"
  },
  {
    title: "動画生成",
    description: "テキスト→動画 / 画像→動画",
    href: "/video",
    label: "動画生成",
    imageSrc: "/cards/video.png"
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white bg-slate-950">
      <div className="animated-ai-bg" />
      <FlyingTanukis />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-200 backdrop-blur-xl">
            Google系生成AIプラットフォーム / NeuroRing
          </div>

          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            AI機能を、
            <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-purple-300 bg-clip-text text-transparent">
              ひとつの入口から。
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            チャット、画像生成、動画生成をまとめて使える簡易AIプラットフォームです。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {modes.map((mode) => (
            <Link
              key={mode.href}
              href={mode.href}
              className="group rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/15"
            >
            <div className="relative mb-6 h-32 overflow-hidden rounded-2xl shadow-lg transition duration-300 group-hover:scale-[1.02]">
              <img
                src={mode.imageSrc}
                alt=""
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

              <span className="absolute bottom-4 left-4 text-sm font-medium text-white/90">
                {mode.label}
              </span>
            </div>
              <h2 className="text-2xl font-semibold">{mode.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {mode.description}
              </p>

              <div className="mt-6 inline-flex items-center text-sm font-medium text-cyan-200">
                開く
                <span className="ml-1 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function FlyingTanukis() {
  return (
    <div className="flying-tanukis" aria-hidden="true">
      {[1, 2, 3].map((num) => (
        <div key={num} className={`tanuki-fly tanuki-${num}`}>
          <div className="tanuki-drift">
            <span className="sparkle sparkle-1" />
            <span className="sparkle sparkle-2" />
            <span className="sparkle sparkle-3" />
            <span className="sparkle sparkle-4" />
            <span className="sparkle sparkle-5" />
            <span className="sparkle sparkle-6" />
            <img src="/tanuki.png" className="tanuki" alt="" />
          </div>
        </div>
      ))}
    </div>
  );
}