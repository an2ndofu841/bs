'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { BrainstormSession } from '@/types/database';
import { IDEATION_MODE_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<BrainstormSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const loadSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('brainstorm_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to load sessions:', error);
    }
    setSessions(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserName(user.email?.split('@')[0] || 'User');
      loadSessions();
    }
    init();
  }, [supabase, router, loadSessions]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function handleDelete(id: string) {
    await supabase.from('brainstorm_sessions').delete().eq('id', id);
    loadSessions();
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white text-lg">⚡</span>
            </div>
            <span className="font-bold text-xl text-gray-900">IdeaForge</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">👋 {userName}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="text-gray-500 mt-1">アイディアの庭を管理しよう</p>
          </div>
          <Link href="/session/new">
            <Button size="lg">
              <span className="text-lg">✨</span>
              新しいブレストを始める
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <Link href="/session/new?type=solo">
            <Card hover className="p-6 cursor-pointer border border-transparent hover:border-brand-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl">
                  🧠
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">ソロモード</h3>
                  <p className="text-sm text-gray-500">一人でじっくりアイディアを育てる</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/session/new?type=shared">
            <Card hover className="p-6 cursor-pointer border border-transparent hover:border-brand-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">共有モード</h3>
                  <p className="text-sm text-gray-500">チームでリアルタイムにブレスト</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          セッション一覧
          {sessions.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              {sessions.length}件
            </span>
          )}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">まだセッションがありません</h3>
            <p className="text-gray-500 mb-6">最初のブレストを始めてみましょう！</p>
            <Link href="/session/new">
              <Button>ブレストを始める</Button>
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card hover className="p-5 cursor-pointer group relative">
                    <Link href={`/session/${s.id}/solo`} className="block">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant={s.session_type === 'shared' ? 'purple' : 'info'}>
                          {s.session_type === 'shared' ? '👥 共有' : '🧠 ソロ'}
                        </Badge>
                        <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                          {s.status === 'active' ? '進行中' : s.status === 'completed' ? '完了' : s.status}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                        {s.title || s.theme}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{s.goal}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{IDEATION_MODE_LABELS[s.mode]?.emoji} {IDEATION_MODE_LABELS[s.mode]?.label}</span>
                        <span>·</span>
                        <span>{new Date(s.updated_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(s.id); }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                      title="削除"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                      </svg>
                    </button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
