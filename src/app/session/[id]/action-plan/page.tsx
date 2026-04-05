'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session-store';
import type { IdeaNode, ActionPlan } from '@/types/database';
import { IDEA_NODE_TYPE_CONFIG } from '@/types/database';
import type { AIGeneratedActionPlan } from '@/lib/ai/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateId } from '@/lib/utils/id';

export default function ActionPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { session, nodes, actionPlans, setSession, setNodes, setActionPlans, addActionPlan } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);

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

      const { data: plansData } = await supabase
        .from('action_plans')
        .select('*')
        .eq('session_id', sessionId);
      setActionPlans(plansData || []);

      setLoading(false);
    }
    load();
  }, [sessionId, supabase, router, setSession, setNodes, setActionPlans]);

  const handleGeneratePlan = useCallback(async (node: IdeaNode) => {
    if (!session) return;
    setGenerating(node.id);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'actionPlan',
          idea: { title: node.title, description: node.description },
          theme: session.theme,
          goal: session.goal,
          target: session.target,
        }),
      });

      const { result } = await res.json() as { result: AIGeneratedActionPlan };

      const newPlan: ActionPlan = {
        id: generateId(),
        session_id: session.id,
        node_id: node.id,
        summary: result.summary,
        target_user: result.targetUser,
        value_proposition: result.valueProposition,
        steps: result.steps,
        kpi: result.kpi,
        risks: result.risks,
        priority: result.priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabase.from('action_plans').insert(newPlan);
      addActionPlan(newPlan);
      setSelectedPlan(newPlan);
    } finally {
      setGenerating(null);
    }
  }, [session, supabase, addActionPlan]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const priorityColors = { high: 'bg-red-50 text-red-700', medium: 'bg-amber-50 text-amber-700', low: 'bg-green-50 text-green-700' };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/session/${sessionId}/solo`} className="text-sm text-gray-500 hover:text-brand-600">
              ← キャンバスに戻る
            </Link>
            <h1 className="font-bold text-gray-900">🚀 実行案化</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Node list */}
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 mb-2">アイディアを選択</h2>
            <p className="text-sm text-gray-500 mb-4">実行案化したいアイディアを選んでください</p>

            <div className="space-y-3">
              {nodes.map((node) => {
                const config = IDEA_NODE_TYPE_CONFIG[node.type];
                const hasPlan = actionPlans.some(p => p.node_id === node.id);
                return (
                  <motion.div
                    key={node.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{config.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 line-clamp-2">{node.title}</div>
                        <Badge variant="default" className="mt-1">{config.label}</Badge>
                      </div>
                      <Button
                        variant={hasPlan ? 'ghost' : 'primary'}
                        size="sm"
                        loading={generating === node.id}
                        onClick={() => {
                          if (hasPlan) {
                            const plan = actionPlans.find(p => p.node_id === node.id)!;
                            setSelectedPlan(plan);
                          } else {
                            handleGeneratePlan(node);
                          }
                        }}
                      >
                        {hasPlan ? '表示' : '生成'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Action plan detail */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedPlan ? (
                <motion.div
                  key={selectedPlan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">📋 実行計画</h2>
                      <Badge className={priorityColors[selectedPlan.priority]}>
                        {selectedPlan.priority === 'high' ? '高優先' : selectedPlan.priority === 'medium' ? '中優先' : '低優先'}
                      </Badge>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">企画概要</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{selectedPlan.summary}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ターゲット</h3>
                          <p className="text-sm text-gray-700">{selectedPlan.target_user}</p>
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">提供価値</h3>
                          <p className="text-sm text-gray-700">{selectedPlan.value_proposition}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">実施ステップ</h3>
                        <div className="space-y-3">
                          {(selectedPlan.steps as { order: number; title: string; detail: string }[]).map((step) => (
                            <div key={step.order} className="flex gap-3 items-start">
                              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {step.order}
                              </div>
                              <div>
                                <div className="font-medium text-sm text-gray-900">{step.title}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{step.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">KPI</h3>
                          <div className="space-y-2">
                            {(selectedPlan.kpi as { metric: string; target: string }[]).map((k, i) => (
                              <div key={i} className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                                <div className="text-xs text-blue-600 font-medium">{k.metric}</div>
                                <div className="text-sm font-bold text-blue-900">{k.target}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">リスク</h3>
                          <div className="space-y-2">
                            {(selectedPlan.risks as { risk: string; mitigation: string }[]).map((r, i) => (
                              <div key={i} className="p-2 rounded-lg bg-red-50 border border-red-100">
                                <div className="text-xs text-red-600 font-medium">{r.risk}</div>
                                <div className="text-xs text-red-800 mt-0.5">{r.mitigation}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-96"
                >
                  <div className="text-center">
                    <div className="text-5xl mb-4">🚀</div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">実行案を生成しましょう</h3>
                    <p className="text-gray-500 text-sm">左のアイディアを選んで「生成」をクリック</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
