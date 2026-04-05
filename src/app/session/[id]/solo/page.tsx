'use client';

import { useEffect, useState, useCallback, useRef, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session-store';
import { BrainstormCanvas } from '@/components/canvas/brainstorm-canvas';
import { ActionPanel } from '@/components/canvas/action-panel';
import { IdeaInputBar } from '@/components/canvas/idea-input-bar';
import { QuickActions } from '@/components/canvas/quick-actions';
import { PerspectiveModal } from '@/components/canvas/perspective-modal';
import { generateId } from '@/lib/utils/id';
import type { IdeaNode, IdeaEdge } from '@/types/database';
import { IDEATION_MODE_LABELS } from '@/types/database';
import { PERSPECTIVE_CARDS } from '@/lib/ai/perspective-cards';

type ViewMode = 'diverge' | 'organize';

export default function SoloBrainstormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const {
    session, nodes, setSession, setNodes, setEdges, addNode, addEdge,
    updateNode, selectedNodeId, selectNode, isGenerating, setIsGenerating,
  } = useSessionStore();

  const [loading, setLoading] = useState(true);
  const [showPerspective, setShowPerspective] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('diverge');
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const initialGeneratedRef = useRef(false);

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  useEffect(() => {
    async function loadSession() {
      const { data: sessionData, error: sessionError } = await supabase
        .from('brainstorm_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        router.push('/dashboard');
        return;
      }

      setSession(sessionData);

      const { data: nodesData } = await supabase
        .from('idea_nodes')
        .select('*')
        .eq('session_id', sessionId);

      const { data: edgesData } = await supabase
        .from('idea_edges')
        .select('*')
        .eq('session_id', sessionId);

      setNodes(nodesData || []);
      setEdges(edgesData || []);
      setLoading(false);

      if (nodesData && nodesData.length > 0) {
        initialGeneratedRef.current = true;
        setCenterNodeId(nodesData[0].id);
      }
    }

    loadSession();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session || initialGeneratedRef.current || loading || nodes.length > 0) return;
    initialGeneratedRef.current = true;
    generateInitialIdeas();
  }, [session, loading, nodes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateInitialIdeas = useCallback(async () => {
    if (!session) return;
    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          theme: session.theme,
          goal: session.goal,
          target: session.target,
          constraints: session.constraints,
          avoidRules: session.avoid_rules,
          mode: session.mode,
          count: 5,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${res.status}`);
      }

      const { result: ideas } = await res.json();
      if (!ideas || !Array.isArray(ideas)) throw new Error('Invalid AI response');

      let firstId: string | null = null;

      for (let i = 0; i < ideas.length; i++) {
        const angle = (2 * Math.PI * i) / ideas.length - Math.PI / 2;
        const newNode: IdeaNode = {
          id: generateId(),
          session_id: session.id,
          parent_id: null,
          type: ideas[i].type,
          title: ideas[i].title,
          description: ideas[i].description,
          position_x: 400 + 180 * Math.cos(angle),
          position_y: 250 + 180 * Math.sin(angle),
          cluster_key: null,
          source_type: 'ai',
          created_by: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (i === 0) firstId = newNode.id;
        await new Promise(r => setTimeout(r, 200));
        addNode(newNode);
        await supabase.from('idea_nodes').insert(newNode);
      }

      if (firstId) {
        setCenterNodeId(firstId);
        selectNode(firstId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'アイディア生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectCenter = useCallback((id: string) => {
    setCenterNodeId(id);
    selectNode(id);
  }, [selectNode]);

  const handleDerive = useCallback(async (deriveAction: string) => {
    const target = nodes.find(n => n.id === centerNodeId) || selectedNode;
    if (!target || !session) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'derive',
          parentTitle: target.title,
          parentDescription: target.description,
          deriveAction,
          mode: session.mode,
          context: { theme: session.theme, goal: session.goal, target: session.target },
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const { result: idea } = await res.json();

      const newNode: IdeaNode = {
        id: generateId(),
        session_id: session.id,
        parent_id: target.id,
        type: idea.type,
        title: idea.title,
        description: idea.description,
        position_x: target.position_x + (Math.random() - 0.5) * 120,
        position_y: target.position_y + 80 + Math.random() * 40,
        cluster_key: null,
        source_type: 'ai',
        created_by: null,
        metadata: { derivedFrom: deriveAction },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      addNode(newNode);
      await supabase.from('idea_nodes').insert(newNode);

      const newEdge: IdeaEdge = {
        id: generateId(),
        session_id: session.id,
        from_node_id: target.id,
        to_node_id: newNode.id,
        edge_type: 'derived',
      };

      addEdge(newEdge);
      await supabase.from('idea_edges').insert(newEdge);
    } catch (e) {
      console.error('Failed to derive:', e);
      setError('派生に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [nodes, centerNodeId, selectedNode, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePerspective = useCallback(() => {
    if (!centerNodeId && !selectedNodeId) return;
    setShowPerspective(true);
  }, [centerNodeId, selectedNodeId]);

  const handleApplyPerspective = useCallback(async (perspectiveKey: string) => {
    const target = nodes.find(n => n.id === centerNodeId) || selectedNode;
    if (!target || !session) return;

    const perspective = PERSPECTIVE_CARDS.find(p => p.key === perspectiveKey);
    if (!perspective) return;

    setShowPerspective(false);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'perspective',
          currentIdea: { title: target.title, description: target.description },
          perspectiveKey: perspective.key,
          perspectiveLabel: perspective.label,
          mode: session.mode,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const { result: idea } = await res.json();

      const newNode: IdeaNode = {
        id: generateId(),
        session_id: session.id,
        parent_id: target.id,
        type: idea.type,
        title: idea.title,
        description: idea.description,
        position_x: target.position_x + (Math.random() - 0.5) * 150,
        position_y: target.position_y + 100,
        cluster_key: null,
        source_type: 'perspective',
        created_by: null,
        metadata: { perspective: perspectiveKey },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      addNode(newNode);
      await supabase.from('idea_nodes').insert(newNode);

      const newEdge: IdeaEdge = {
        id: generateId(),
        session_id: session.id,
        from_node_id: target.id,
        to_node_id: newNode.id,
        edge_type: 'derived',
      };

      addEdge(newEdge);
      await supabase.from('idea_edges').insert(newEdge);
    } catch (e) {
      console.error('Failed perspective:', e);
    } finally {
      setIsGenerating(false);
    }
  }, [nodes, centerNodeId, selectedNode, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRescue = useCallback(async (rescueType: string) => {
    if (!session) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rescue',
          theme: session.theme,
          goal: session.goal,
          existingIdeas: nodes.map(n => ({ title: n.title, description: n.description })),
          rescueType,
          mode: session.mode,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const { result: ideas } = await res.json();

      for (let i = 0; i < ideas.length; i++) {
        const newNode: IdeaNode = {
          id: generateId(),
          session_id: session.id,
          parent_id: null,
          type: ideas[i].type,
          title: ideas[i].title,
          description: ideas[i].description,
          position_x: 100 + Math.random() * 600,
          position_y: 100 + Math.random() * 400,
          cluster_key: null,
          source_type: 'rescue',
          created_by: null,
          metadata: { rescueType },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await new Promise(r => setTimeout(r, 150));
        addNode(newNode);
        await supabase.from('idea_nodes').insert(newNode);
      }
    } catch (e) {
      console.error('Failed rescue:', e);
    } finally {
      setIsGenerating(false);
    }
  }, [session, nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputSubmit = useCallback(async (text: string, autoGenerate: boolean) => {
    if (!session) return;

    const newNode: IdeaNode = {
      id: generateId(),
      session_id: session.id,
      parent_id: null,
      type: 'seed',
      title: text,
      description: '',
      position_x: 200 + Math.random() * 400,
      position_y: 150 + Math.random() * 300,
      cluster_key: null,
      source_type: 'manual',
      created_by: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addNode(newNode);
    await supabase.from('idea_nodes').insert(newNode);
    setCenterNodeId(newNode.id);
    selectNode(newNode.id);

    if (autoGenerate) {
      setIsGenerating(true);
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'derive',
            parentTitle: text,
            parentDescription: '',
            deriveAction: 'broaden',
            mode: session.mode,
            context: { theme: session.theme, goal: session.goal, target: session.target },
          }),
        });

        if (res.ok) {
          const { result: idea } = await res.json();
          const derivedNode: IdeaNode = {
            id: generateId(),
            session_id: session.id,
            parent_id: newNode.id,
            type: idea.type,
            title: idea.title,
            description: idea.description,
            position_x: newNode.position_x + (Math.random() - 0.5) * 120,
            position_y: newNode.position_y + 80,
            cluster_key: null,
            source_type: 'ai',
            created_by: null,
            metadata: { derivedFrom: 'auto' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          addNode(derivedNode);
          await supabase.from('idea_nodes').insert(derivedNode);
          addEdge({
            id: generateId(),
            session_id: session.id,
            from_node_id: newNode.id,
            to_node_id: derivedNode.id,
            edge_type: 'derived',
          });
        }
      } catch { /* silently continue */ } finally {
        setIsGenerating(false);
      }
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFavorite = useCallback(() => {
    const target = nodes.find(n => n.id === centerNodeId);
    if (!target) return;
    const meta = (target.metadata || {}) as Record<string, unknown>;
    const isFav = !meta.favorite;
    updateNode(target.id, { metadata: { ...meta, favorite: isFav } });
    supabase
      .from('idea_nodes')
      .update({ metadata: { ...meta, favorite: isFav } })
      .eq('id', target.id)
      .then(() => {});
  }, [nodes, centerNodeId, updateNode, supabase]);

  const favoriteCount = useMemo(
    () => nodes.filter(n => (n.metadata as Record<string, unknown>)?.favorite).length,
    [nodes]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas-bg)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500 font-medium">セッションを読み込み中...</p>
        </motion.div>
      </div>
    );
  }

  if (!session) return null;

  const modeConfig = IDEATION_MODE_LABELS[session.mode];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--color-canvas-bg)]">
      {/* Top bar */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-2 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-700 transition-colors text-sm flex items-center gap-1"
          >
            ← 戻る
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-lg">{modeConfig.emoji}</span>
            <div>
              <h1 className="font-bold text-sm text-gray-900 leading-none">{session.theme}</h1>
              <p className="text-[10px] text-gray-500">{session.goal}</p>
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 rounded-xl p-0.5 flex">
            <button
              onClick={() => setViewMode('diverge')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'diverge'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🌊 発散
            </button>
            <button
              onClick={() => setViewMode('organize')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'organize'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🗂️ 整理
            </button>
          </div>

          <div className="h-5 w-px bg-gray-200" />

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {favoriteCount > 0 && (
              <span className="flex items-center gap-1">
                ❤️ <span className="font-semibold">{favoriteCount}</span>
              </span>
            )}
          </div>

          <div className="h-5 w-px bg-gray-200" />

          <div className="flex items-center gap-1">
            <Link
              href={`/session/${session.id}/organize`}
              className="text-xs text-gray-500 hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
            >
              🗂️ クラスタリング
            </Link>
            <Link
              href={`/session/${session.id}/action-plan`}
              className="text-xs text-gray-500 hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
            >
              🚀 実行案化
            </Link>
          </div>
        </div>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm shadow-lg"
          >
            ⚠️ {error}
            <button onClick={() => setError('')} className="ml-3 text-red-400 hover:text-red-600 cursor-pointer">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'diverge' ? (
          <>
            {/* Canvas */}
            <div className="flex-1 relative">
              <BrainstormCanvas
                onSelectCenter={handleSelectCenter}
                centerNodeId={centerNodeId}
              />

              {/* Quick actions bar */}
              <QuickActions
                node={centerNodeId ? nodes.find(n => n.id === centerNodeId) || null : null}
                onDerive={handleDerive}
                onFavorite={handleFavorite}
                isGenerating={isGenerating}
              />

              {/* Input bar */}
              <IdeaInputBar
                onSubmit={handleInputSubmit}
                disabled={isGenerating}
              />
            </div>

            {/* Right panel: Thought Booster */}
            <ActionPanel
              selectedNode={centerNodeId ? nodes.find(n => n.id === centerNodeId) || null : selectedNode}
              onDerive={handleDerive}
              onPerspective={handlePerspective}
              onRescue={handleRescue}
              isGenerating={isGenerating}
            />
          </>
        ) : (
          <OrganizeView
            nodes={nodes}
            sessionId={session.id}
            onSelectCenter={handleSelectCenter}
          />
        )}
      </div>

      {showPerspective && (
        <PerspectiveModal
          onSelect={handleApplyPerspective}
          onClose={() => setShowPerspective(false)}
        />
      )}
    </div>
  );
}

function OrganizeView({ nodes, sessionId, onSelectCenter }: {
  nodes: IdeaNode[];
  sessionId: string;
  onSelectCenter: (id: string) => void;
}) {
  const clusters = useMemo(() => {
    const groups: Record<string, IdeaNode[]> = {};
    const favorites: IdeaNode[] = [];
    const unclustered: IdeaNode[] = [];

    for (const node of nodes) {
      const meta = node.metadata as Record<string, unknown>;
      if (meta?.favorite) favorites.push(node);
      if (node.cluster_key) {
        if (!groups[node.cluster_key]) groups[node.cluster_key] = [];
        groups[node.cluster_key].push(node);
      } else {
        unclustered.push(node);
      }
    }

    return { groups, favorites, unclustered };
  }, [nodes]);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">整理モード</h2>
          <Link
            href={`/session/${sessionId}/organize`}
            className="text-sm text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
          >
            AIクラスタリングへ →
          </Link>
        </div>

        {clusters.favorites.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-pink-600 mb-3 flex items-center gap-2">
              ❤️ お気に入り ({clusters.favorites.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {clusters.favorites.map(node => (
                <OrganizeCard key={node.id} node={node} onClick={() => onSelectCenter(node.id)} />
              ))}
            </div>
          </div>
        )}

        {Object.entries(clusters.groups).map(([key, groupNodes]) => (
          <div key={key}>
            <h3 className="font-bold text-sm text-gray-700 mb-3">📁 {key} ({groupNodes.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {groupNodes.map(node => (
                <OrganizeCard key={node.id} node={node} onClick={() => onSelectCenter(node.id)} />
              ))}
            </div>
          </div>
        ))}

        <div>
          <h3 className="font-bold text-sm text-gray-500 mb-3">全アイディア ({clusters.unclustered.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {clusters.unclustered.map(node => (
              <OrganizeCard key={node.id} node={node} onClick={() => onSelectCenter(node.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganizeCard({ node, onClick }: { node: IdeaNode; onClick: () => void }) {
  const meta = node.metadata as Record<string, unknown>;
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        w-full text-left idea-node-${node.type}
        rounded-xl px-4 py-3 shadow-[var(--shadow-card)]
        hover:shadow-[var(--shadow-card-hover)] transition-shadow cursor-pointer
        ${meta?.favorite ? 'idea-node-favorite' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">
          {node.source_type === 'manual' ? '✍️' : '🤖'}
        </span>
        {Boolean(meta?.favorite) && <span className="text-xs">❤️</span>}
      </div>
      <div className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{node.title}</div>
      {node.description && (
        <div className="text-[11px] text-gray-500 line-clamp-2">{node.description}</div>
      )}
    </motion.button>
  );
}
