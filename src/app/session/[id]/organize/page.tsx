'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session-store';
import type { BrainstormSession, IdeaNode } from '@/types/database';
import { IDEA_NODE_TYPE_CONFIG } from '@/types/database';
import type { AIClusterResult } from '@/lib/ai/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type BucketKey = 'now' | 'hold' | 'mid_term' | 'discard';

const BUCKET_CONFIG: Record<BucketKey, { label: string; emoji: string; color: string }> = {
  now: { label: '今すぐ試す', emoji: '🚀', color: 'bg-emerald-50 border-emerald-200' },
  hold: { label: '保留', emoji: '⏸️', color: 'bg-amber-50 border-amber-200' },
  mid_term: { label: '中長期', emoji: '📅', color: 'bg-blue-50 border-blue-200' },
  discard: { label: '捨てる', emoji: '🗑️', color: 'bg-gray-50 border-gray-200' },
};

export default function OrganizePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { session, nodes, setSession, setNodes } = useSessionStore();

  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [clusterResult, setClusterResult] = useState<AIClusterResult | null>(null);
  const [buckets, setBuckets] = useState<Record<string, BucketKey>>({});

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
      setLoading(false);
    }
    load();
  }, [sessionId, supabase, router, setSession, setNodes]);

  const handleCluster = useCallback(async () => {
    setClustering(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cluster',
          ideas: nodes.map(n => ({ id: n.id, title: n.title, description: n.description })),
        }),
      });
      const { result } = await res.json();
      setClusterResult(result);
    } finally {
      setClustering(false);
    }
  }, [nodes]);

  const handleBucketChange = useCallback((nodeId: string, bucket: BucketKey) => {
    setBuckets(prev => ({ ...prev, [nodeId]: bucket }));
  }, []);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const clusterGroups = clusterResult?.clusters || [];

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/session/${sessionId}/solo`} className="text-sm text-gray-500 hover:text-brand-600">
              ← キャンバスに戻る
            </Link>
            <h1 className="font-bold text-gray-900">🗂️ 整理・クラスタリング</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleCluster} loading={clustering}>
              🤖 AIでクラスタリング
            </Button>
            <Link href={`/session/${sessionId}/action-plan`}>
              <Button>🚀 実行案化へ →</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {clusterGroups.length > 0 ? (
              clusterGroups.map((cluster) => {
                const clusterNodes = nodes.filter(n => cluster.ideaIds.includes(n.id));
                return (
                  <Card key={cluster.key} className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-brand-500" />
                      {cluster.label}
                      <span className="text-sm text-gray-400 font-normal">({clusterNodes.length}件)</span>
                    </h3>
                    <div className="space-y-3">
                      {clusterNodes.map((node) => {
                        const config = IDEA_NODE_TYPE_CONFIG[node.type];
                        return (
                          <div key={node.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-lg mt-0.5">{config.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900">{node.title}</div>
                              {node.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{node.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              {(Object.entries(BUCKET_CONFIG) as [BucketKey, typeof BUCKET_CONFIG[BucketKey]][]).map(([key, cfg]) => (
                                <button
                                  key={key}
                                  onClick={() => handleBucketChange(node.id, key)}
                                  className={`text-xs px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                    buckets[node.id] === key
                                      ? cfg.color + ' font-medium'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  title={cfg.label}
                                >
                                  {cfg.emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-3">🗂️</div>
                <h3 className="font-bold text-gray-900 mb-2">アイディアを整理しましょう</h3>
                <p className="text-gray-500 text-sm mb-4">
                  AIが類似したアイディアを自動的にグルーピングします
                </p>
                <Button onClick={handleCluster} loading={clustering}>
                  🤖 AIでクラスタリングする
                </Button>

                {nodes.length > 0 && (
                  <div className="mt-8 text-left space-y-3">
                    <h4 className="font-bold text-gray-700 text-sm">すべてのアイディア ({nodes.length}件)</h4>
                    {nodes.map((node) => {
                      const config = IDEA_NODE_TYPE_CONFIG[node.type];
                      return (
                        <div key={node.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                          <span>{config.emoji}</span>
                          <span className="text-sm font-medium text-gray-900">{node.title}</span>
                          <Badge variant="default">{config.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {clusterResult && (
              <>
                <Card className="p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>⚠️</span> 不足視点
                  </h3>
                  <div className="space-y-2">
                    {clusterResult.gaps.map((gap, i) => (
                      <div key={i} className="text-sm text-gray-700 p-2 rounded-lg bg-amber-50 border border-amber-100">
                        {gap}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📊</span> 思考の偏り
                  </h3>
                  <div className="space-y-2">
                    {clusterResult.biases.map((bias, i) => (
                      <div key={i} className="text-sm text-gray-700 p-2 rounded-lg bg-purple-50 border border-purple-100">
                        {bias}
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            <Card className="p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📋</span> 振り分け状況
              </h3>
              {(Object.entries(BUCKET_CONFIG) as [BucketKey, typeof BUCKET_CONFIG[BucketKey]][]).map(([key, cfg]) => {
                const count = Object.values(buckets).filter(b => b === key).length;
                return (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-700">{cfg.emoji} {cfg.label}</span>
                    <span className="font-bold text-sm text-gray-900">{count}</span>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
