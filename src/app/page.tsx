'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const features = [
  { emoji: '🌱', title: '種を蒔く', desc: 'テーマを入れるだけで、AIがアイディアの種を生成' },
  { emoji: '🌿', title: '芽を育てる', desc: 'ワンタップで派生・深掘り・視点チェンジ' },
  { emoji: '✨', title: '掛け合わせる', desc: 'カード同士を近づけて、新しい発想を生む' },
  { emoji: '🗂️', title: '整理する', desc: 'AIが自動クラスタリング、偏りも可視化' },
  { emoji: '🚀', title: '実行案にする', desc: 'アイディアをKPI付きの施策に変換' },
  { emoji: '👥', title: 'チームで使う', desc: 'リアルタイム共有、投票、ファシリテーション' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white text-lg">⚡</span>
            </div>
            <span className="font-bold text-xl text-gray-900">IdeaForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">ログイン</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">無料で始める</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24">
        <section className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div custom={0} variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium">
                ✨ 次世代ブレストツール
              </span>
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight"
            >
              アイディアを
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-500">
                触って増やす
              </span>
              <br />
              最強のブレスト体験
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
            >
              書くのではなく、触る。考え込むのではなく、遊ぶ。
              <br />
              アイディアの種をまき、育て、掛け合わせ、
              <br />
              実行案まで一気に駆け抜ける。
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="flex items-center justify-center gap-4 pt-4">
              <Link href="/auth/signup">
                <Button size="lg" className="text-base px-8">
                  無料で始める →
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="secondary" size="lg" className="text-base">
                  ログイン
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="bg-white rounded-3xl shadow-[var(--shadow-float)] border border-gray-100 overflow-hidden p-8">
              <div className="canvas-grid rounded-2xl bg-[var(--color-canvas-bg)] p-12 min-h-[320px] flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-32 h-32 rounded-full bg-brand-500/10 flex items-center justify-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center">
                      <span className="text-3xl">💡</span>
                    </div>
                  </motion.div>
                </div>

                {[
                  { x: -200, y: -60, label: 'サブスク化', type: 'seed' },
                  { x: 180, y: -80, label: 'ゲーミフィケーション', type: 'sprout' },
                  { x: -160, y: 80, label: 'AIで自動化', type: 'card' },
                  { x: 200, y: 60, label: 'MVP設計', type: 'action_plan' },
                  { x: -40, y: -120, label: 'コミュニティ化', type: 'seed' },
                  { x: 60, y: 110, label: '収益モデル', type: 'sprout' },
                ].map((node, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.15, duration: 0.5, type: 'spring' }}
                    className={`absolute idea-node-${node.type} px-4 py-2 rounded-xl text-sm font-medium shadow-sm cursor-default`}
                    style={{
                      left: `calc(50% + ${node.x}px)`,
                      top: `calc(50% + ${node.y}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {node.label}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-32">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 mb-16"
          >
            発散から実行まで、
            <span className="text-brand-600">ノンストップ</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] border border-gray-50 hover:shadow-[var(--shadow-card-hover)] transition-shadow"
              >
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-12 text-white"
          >
            <h2 className="text-3xl font-bold mb-4">今すぐブレストを始めよう</h2>
            <p className="text-brand-200 mb-8 text-lg">
              一人でも、チームでも。
              <br />
              アイディアが止まらない体験を。
            </p>
            <Link href="/auth/signup">
              <Button variant="secondary" size="lg" className="text-brand-700 bg-white hover:bg-brand-50 text-base px-8">
                無料アカウントを作成 →
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-400">
          © 2026 IdeaForge. 最強で最高に楽しいブレストツール.
        </div>
      </footer>
    </div>
  );
}
