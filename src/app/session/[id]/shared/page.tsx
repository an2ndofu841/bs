'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session-store';
import { useSharedStore } from '@/stores/shared-store';
import type { BrainstormSession, IdeaNode, SessionParticipant, ParticipantInput } from '@/types/database';
import { IDEATION_MODE_LABELS, IDEA_NODE_TYPE_CONFIG } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { generateId } from '@/lib/utils/id';

export default function SharedSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { session, nodes, setSession, setNodes, isGenerating, setIsGenerating, addNode } = useSessionStore();
  const { participants, inputs, setParticipants, setInputs, addInput } = useSharedStore();
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

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

      const { data: inputsData } = await supabase
        .from('participant_inputs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      setInputs(inputsData || []);

      setLoading(false);
    }
    load();
  }, [sessionId, supabase, router, setSession, setNodes, setParticipants, setInputs]);

  useEffect(() => {
    const channel = supabase
      .channel(`shared-session-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'idea_nodes', filter: `session_id=eq.${sessionId}` },
        (payload) => { addNode(payload.new as IdeaNode); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participant_inputs', filter: `session_id=eq.${sessionId}` },
        (payload) => { addInput(payload.new as ParticipantInput); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, supabase, addNode, addInput]);

  const handleCopyShareUrl = useCallback(() => {
    if (!session?.share_code) return;
    const url = `${window.location.origin}/join/${session.share_code}`;
    navigator.clipboard.writeText(url);
    setShareUrlCopied(true);
    setTimeout(() => setShareUrlCopied(false), 2000);
  }, [session]);

  const handleSubmitInput = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !session) return;

    const { data: { user } } = await supabase.auth.getUser();
    const participant = participants.find(p => p.user_id === user?.id);
    if (!participant) return;

    await supabase.from('participant_inputs').insert({
      id: generateId(),
      session_id: session.id,
      participant_id: participant.id,
      content: inputText.trim(),
      input_type: 'idea',
      target_node_id: null,
      metadata: {},
    });

    setInputText('');
  }, [inputText, session, participants, supabase]);

  const handleAIOrganize = useCallback(async () => {
    if (!session) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          theme: session.theme,
          goal: session.goal,
          mode: session.mode,
          count: 3,
        }),
      });

      const { result: ideas } = await res.json();
      for (const idea of ideas) {
        const newNode: IdeaNode = {
          id: generateId(),
          session_id: session.id,
          parent_id: null,
          type: idea.type,
          title: idea.title,
          description: idea.description,
          position_x: 100 + Math.random() * 500,
          position_y: 100 + Math.random() * 300,
          cluster_key: null,
          source_type: 'ai',
          created_by: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await supabase.from('idea_nodes').insert(newNode);
        addNode(newNode);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [session, supabase, addNode, setIsGenerating]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const modeConfig = IDEATION_MODE_LABELS[session.mode];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-950 text-white">
      {/* Left panel */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 p-5 flex flex-col overflow-y-auto">
        <Link href={`/session/${sessionId}/solo`} className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">
          ← キャンバスに戻る
        </Link>

        <div className="mb-6">
          <Badge variant="purple" className="mb-2">共有モード</Badge>
          <h2 className="text-xl font-bold leading-tight">{session.theme}</h2>
          <p className="text-sm text-gray-400 mt-2">{session.goal}</p>
        </div>

        <div className="mb-6">
          <div className="text-xs font-bold text-gray-500 uppercase mb-2">モード</div>
          <div className="text-sm">{modeConfig.emoji} {modeConfig.label}</div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-bold text-gray-500 uppercase mb-2">参加者 ({participants.length})</div>
          <div className="space-y-2">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
                  {p.display_name[0]}
                </div>
                <span>{p.display_name}</span>
                {p.role === 'facilitator' && <Badge variant="warning">MC</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <Button variant="secondary" size="sm" className="w-full" onClick={handleCopyShareUrl}>
            {shareUrlCopied ? '✅ コピーしました' : '🔗 招待URLをコピー'}
          </Button>
          <Link href={`/session/${sessionId}/summary`}>
            <Button variant="ghost" size="sm" className="w-full text-gray-400">
              📝 会議を終了・まとめる
            </Button>
          </Link>
        </div>
      </div>

      {/* Center - Main display */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="text-center">
            <h1 className="text-3xl font-bold">{session.theme}</h1>
            <p className="text-gray-400 mt-1">{session.goal}</p>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {isGenerating && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-brand-900/50 px-4 py-2 rounded-full text-sm">
                  <div className="animate-spin h-4 w-4 border-2 border-brand-400 border-t-transparent rounded-full" />
                  AI が考え中...
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {nodes.map((node, i) => {
                  const config = IDEA_NODE_TYPE_CONFIG[node.type];
                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-gray-800 rounded-2xl p-5 border border-gray-700 hover:border-gray-500 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span>{config.emoji}</span>
                        <span className="text-xs text-gray-500">{config.label}</span>
                      </div>
                      <h3 className="font-bold text-sm leading-snug mb-1">{node.title}</h3>
                      {node.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">{node.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <button className="text-lg hover:scale-125 transition-transform">👍</button>
                        <button className="text-lg hover:scale-125 transition-transform">🔥</button>
                        <button className="text-lg hover:scale-125 transition-transform">💡</button>
                        <button className="text-lg hover:scale-125 transition-transform">🤔</button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-bold text-sm">💬 参加者投稿</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {inputs.map((input) => {
            const participant = participants.find(p => p.id === input.participant_id);
            return (
              <motion.div
                key={input.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold">
                    {participant?.display_name?.[0] || '?'}
                  </div>
                  <span className="text-xs text-gray-400">{participant?.display_name || '匿名'}</span>
                </div>
                <p className="text-sm">{input.content}</p>
              </motion.div>
            );
          })}
          {inputs.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-8">まだ投稿がありません</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <form onSubmit={handleSubmitInput} className="flex gap-2">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="アイディアを投稿..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
            <Button type="submit" size="sm" disabled={!inputText.trim()}>送信</Button>
          </form>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-400"
            onClick={handleAIOrganize}
            loading={isGenerating}
          >
            🤖 AI補助
          </Button>
        </div>
      </div>
    </div>
  );
}
