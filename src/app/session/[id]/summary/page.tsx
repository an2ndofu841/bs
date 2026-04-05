'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session-store';
import { useSharedStore } from '@/stores/shared-store';
import type { AIMeetingSummary } from '@/lib/ai/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { session, nodes, setSession, setNodes } = useSessionStore();
  const { participants, setParticipants } = useSharedStore();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<AIMeetingSummary | null>(null);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase
        .from('brainstorm_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!sessionData) { router.push('/dashboard'); return; }
      setSession(sessionData);

      const { data: nodesData } = await supabase
        .from('idea_nodes')
        .select('*')
        .eq('session_id', sessionId);
      setNodes(nodesData || []);

      const { data: participantsData } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId);
      setParticipants(participantsData || []);

      setLoading(false);
    }
    load();
  }, [sessionId, supabase, router, setSession, setNodes, setParticipants]);

  const handleGenerate = useCallback(async () => {
    if (!session) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'meetingSummary',
          theme: session.theme,
          goal: session.goal,
          ideas: nodes.map(n => ({ title: n.title, description: n.description, type: n.type })),
          participants: participants.map(p => p.display_name),
        }),
      });

      const { result } = await res.json();
      setSummary(result);
    } finally {
      setGenerating(false);
    }
  }, [session, nodes, participants]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/session/${sessionId}/solo`} className="text-sm text-gray-500 hover:text-brand-600">
              ← キャンバスに戻る
            </Link>
            <h1 className="font-bold text-gray-900">📝 会議サマリー</h1>
          </div>
          {!summary && (
            <Button onClick={handleGenerate} loading={generating}>
              🤖 サマリーを生成
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!summary ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">会議サマリーを作成</h2>
            <p className="text-gray-500 mb-2">テーマ: {session.theme}</p>
            <p className="text-gray-500 mb-2">アイディア数: {nodes.length}件</p>
            <p className="text-gray-500 mb-8">参加者: {participants.length}名</p>
            <Button size="lg" onClick={handleGenerate} loading={generating}>
              🤖 AIでサマリーを生成する
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📄</span> 会議要約
              </h2>
              <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>✅</span> 採用案
                </h3>
                <div className="space-y-2">
                  {summary.adoptedIdeas.map((idea, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-sm text-gray-900">{idea}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>⏸️</span> 保留案
                </h3>
                <div className="space-y-2">
                  {summary.pendingIdeas.map((idea, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                      <span className="text-amber-600">•</span>
                      <span className="text-sm text-gray-900">{idea}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>💡</span> 重要なインサイト
              </h3>
              <div className="space-y-2">
                {summary.keyInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="text-blue-500 mt-0.5">💎</span>
                    <span className="text-sm text-gray-900">{insight}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>➡️</span> ネクストステップ
              </h3>
              <div className="space-y-3">
                {summary.nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-900">{step}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-center gap-4 pt-4">
              <Link href={`/session/${sessionId}/action-plan`}>
                <Button size="lg">🚀 実行案化する</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">ダッシュボードに戻る</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
