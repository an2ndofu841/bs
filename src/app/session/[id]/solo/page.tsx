'use client';

import { useEffect, useState, useCallback, useRef, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session-store';
import { SessionSidebar } from '@/components/canvas/session-sidebar';
import { BrainstormCanvas } from '@/components/canvas/brainstorm-canvas';
import { ActionPanel } from '@/components/canvas/action-panel';
import { PerspectiveModal } from '@/components/canvas/perspective-modal';
import { generateId } from '@/lib/utils/id';
import type { IdeaNode, IdeaEdge } from '@/types/database';
import { PERSPECTIVE_CARDS } from '@/lib/ai/perspective-cards';

export default function SoloBrainstormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const {
    session, nodes, setSession, setNodes, setEdges, addNode, addEdge,
    selectedNodeId, selectNode, isGenerating, setIsGenerating,
  } = useSessionStore();

  const [loading, setLoading] = useState(true);
  const [showPerspective, setShowPerspective] = useState(false);
  const [error, setError] = useState('');
  const initialGeneratedRef = useRef(false);

  useEffect(() => {
    async function loadSession() {
      const { data: sessionData, error: sessionError } = await supabase
        .from('brainstorm_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        console.error('Failed to load session:', sessionError);
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
      }
    }

    loadSession();
  }, [sessionId]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session || initialGeneratedRef.current || loading || nodes.length > 0) return;
    initialGeneratedRef.current = true;
    generateInitialIdeas();
  }, [session, loading, nodes.length]);  // eslint-disable-line react-hooks/exhaustive-deps

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
      if (!ideas || !Array.isArray(ideas)) {
        throw new Error('Invalid AI response');
      }

      const centerX = 400;
      const centerY = 250;
      const radius = 180;

      for (let i = 0; i < ideas.length; i++) {
        const angle = (2 * Math.PI * i) / ideas.length - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const newNode: IdeaNode = {
          id: generateId(),
          session_id: session.id,
          parent_id: null,
          type: ideas[i].type,
          title: ideas[i].title,
          description: ideas[i].description,
          position_x: x,
          position_y: y,
          cluster_key: null,
          source_type: 'ai',
          created_by: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await new Promise(resolve => setTimeout(resolve, 200));
        addNode(newNode);

        const { error: insertError } = await supabase.from('idea_nodes').insert(newNode);
        if (insertError) {
          console.error('Failed to save node:', insertError);
        }
      }
    } catch (e) {
      console.error('Failed to generate initial ideas:', e);
      setError(e instanceof Error ? e.message : 'アイディア生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [session]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleDerive = useCallback(async (deriveAction: string) => {
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode || !session) return;

    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'derive',
          parentTitle: selectedNode.title,
          parentDescription: selectedNode.description,
          deriveAction,
          mode: session.mode,
          context: { theme: session.theme, goal: session.goal, target: session.target },
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const { result: idea } = await res.json();

      const offsetX = (Math.random() - 0.5) * 120;
      const offsetY = 80 + Math.random() * 40;

      const newNode: IdeaNode = {
        id: generateId(),
        session_id: session.id,
        parent_id: selectedNode.id,
        type: idea.type,
        title: idea.title,
        description: idea.description,
        position_x: selectedNode.position_x + offsetX,
        position_y: selectedNode.position_y + offsetY,
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
        from_node_id: selectedNode.id,
        to_node_id: newNode.id,
        edge_type: 'derived',
      };

      addEdge(newEdge);
      await supabase.from('idea_edges').insert(newEdge);
      selectNode(newNode.id);
    } catch (e) {
      console.error('Failed to derive idea:', e);
    } finally {
      setIsGenerating(false);
    }
  }, [nodes, selectedNodeId, session]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handlePerspective = useCallback(() => {
    if (!selectedNodeId) return;
    setShowPerspective(true);
  }, [selectedNodeId]);

  const handleApplyPerspective = useCallback(async (perspectiveKey: string) => {
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode || !session) return;

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
          currentIdea: { title: selectedNode.title, description: selectedNode.description },
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
        parent_id: selectedNode.id,
        type: idea.type,
        title: idea.title,
        description: idea.description,
        position_x: selectedNode.position_x + (Math.random() - 0.5) * 150,
        position_y: selectedNode.position_y + 100,
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
        from_node_id: selectedNode.id,
        to_node_id: newNode.id,
        edge_type: 'derived',
      };

      addEdge(newEdge);
      await supabase.from('idea_edges').insert(newEdge);
      selectNode(newNode.id);
    } catch (e) {
      console.error('Failed to apply perspective:', e);
    } finally {
      setIsGenerating(false);
    }
  }, [nodes, selectedNodeId, session]);  // eslint-disable-line react-hooks/exhaustive-deps

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

        await new Promise(resolve => setTimeout(resolve, 150));
        addNode(newNode);
        await supabase.from('idea_nodes').insert(newNode);
      }
    } catch (e) {
      console.error('Failed rescue:', e);
    } finally {
      setIsGenerating(false);
    }
  }, [session, nodes]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddManualNode = useCallback(async (title: string) => {
    if (!session) return;

    const newNode: IdeaNode = {
      id: generateId(),
      session_id: session.id,
      parent_id: null,
      type: 'seed',
      title,
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
    selectNode(newNode.id);
  }, [session]);  // eslint-disable-line react-hooks/exhaustive-deps

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-3 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">セッションを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen flex overflow-hidden">
      <SessionSidebar session={session} nodeCount={nodes.length} />
      <div className="flex-1 flex flex-col relative">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm shadow-lg">
            ⚠️ {error}
          </div>
        )}
        <BrainstormCanvas onAddManualNode={handleAddManualNode} />
      </div>
      <ActionPanel
        selectedNode={selectedNode}
        onDerive={handleDerive}
        onPerspective={handlePerspective}
        onRescue={handleRescue}
        isGenerating={isGenerating}
      />

      {showPerspective && (
        <PerspectiveModal
          onSelect={handleApplyPerspective}
          onClose={() => setShowPerspective(false)}
        />
      )}
    </div>
  );
}
