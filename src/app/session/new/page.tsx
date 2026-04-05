'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { generateShareCode } from '@/lib/utils/id';
import type { IdeationMode, SessionType } from '@/types/database';
import { IDEATION_MODE_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';

function NewSessionForm() {
  const searchParams = useSearchParams();
  const defaultType = (searchParams.get('type') as SessionType) || 'solo';
  const router = useRouter();

  const [theme, setTheme] = useState('');
  const [goal, setGoal] = useState('');
  const [target, setTarget] = useState('');
  const [constraints, setConstraints] = useState('');
  const [avoidRules, setAvoidRules] = useState('');
  const [mode, setMode] = useState<IdeationMode>('mass');
  const [sessionType, setSessionType] = useState<SessionType>(defaultType);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('brainstorm_sessions')
      .insert({
        user_id: user.id,
        title: theme,
        theme,
        goal,
        target: target || null,
        constraints: constraints || null,
        avoid_rules: avoidRules || null,
        mode,
        session_type: sessionType,
        status: 'active',
        share_code: sessionType === 'shared' ? generateShareCode() : null,
      })
      .select()
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    if (sessionType === 'shared') {
      await supabase.from('session_participants').insert({
        session_id: data.id,
        user_id: user.id,
        display_name: user.email?.split('@')[0] || 'ファシリテーター',
        role: 'facilitator',
      });
    }

    router.push(`/session/${data.id}/solo`);
  }

  return (
    <form onSubmit={handleCreate} className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span> テーマと目的
        </h2>
        <div className="space-y-4">
          <Input
            label="テーマ（何についてブレストする？）"
            placeholder="例：Z世代向けの新しい英語学習サービス"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            required
          />
          <TextArea
            label="目的（何を達成したい？）"
            placeholder="例：競合と差別化できるユニークなコンセプトを見つけたい"
            rows={3}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1"
        >
          {showAdvanced ? '▼' : '▶'} 詳細設定（任意）
        </button>

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 mt-4"
          >
            <Input
              label="ターゲット"
              placeholder="例：20代の社会人、英語初心者"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <TextArea
              label="制約条件"
              placeholder="例：開発予算500万円以内、3ヶ月でMVP"
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
            />
            <TextArea
              label="避けたいこと"
              placeholder="例：既存の英会話スクールと同じ仕組み"
              rows={2}
              value={avoidRules}
              onChange={(e) => setAvoidRules(e.target.value)}
            />
          </motion.div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🔮</span> 発想モード
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(IDEATION_MODE_LABELS) as [IdeationMode, typeof IDEATION_MODE_LABELS[IdeationMode]][]).map(
            ([key, { label, description, emoji }]) => (
              <motion.button
                key={key}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode(key)}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  mode === key
                    ? 'border-brand-500 bg-brand-50 shadow-md'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="font-bold text-sm text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{description}</div>
              </motion.button>
            )
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">💻</span> 利用モード
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSessionType('solo')}
            className={`p-5 rounded-xl border-2 text-left cursor-pointer transition-all ${
              sessionType === 'solo'
                ? 'border-brand-500 bg-brand-50 shadow-md'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className="text-3xl mb-2">🧠</div>
            <div className="font-bold text-gray-900">ソロモード</div>
            <div className="text-sm text-gray-500 mt-1">
              一人でじっくりアイディアを発散・育成
            </div>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSessionType('shared')}
            className={`p-5 rounded-xl border-2 text-left cursor-pointer transition-all ${
              sessionType === 'shared'
                ? 'border-brand-500 bg-brand-50 shadow-md'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-bold text-gray-900">共有モード</div>
            <div className="text-sm text-gray-500 mt-1">
              チームでリアルタイムにブレスト
            </div>
          </motion.button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Link href="/dashboard">
          <Button variant="ghost" type="button">← 戻る</Button>
        </Link>
        <Button type="submit" size="lg" loading={loading} disabled={!theme || !goal}>
          ✨ ブレストを開始する
        </Button>
      </div>
    </form>
  );
}

export default function NewSessionPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white text-lg">⚡</span>
            </div>
            <span className="font-bold text-xl text-gray-900">IdeaForge</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新しいブレスト</h1>
          <p className="text-gray-500 mb-8">テーマを決めて、アイディアの冒険を始めよう</p>

          <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] p-8">
            <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-xl" />}>
              <NewSessionForm />
            </Suspense>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
