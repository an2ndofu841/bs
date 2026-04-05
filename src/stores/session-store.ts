'use client';

import { create } from 'zustand';
import type { BrainstormSession, IdeaNode, IdeaEdge, ActionPlan } from '@/types/database';

interface SessionState {
  session: BrainstormSession | null;
  nodes: IdeaNode[];
  edges: IdeaEdge[];
  actionPlans: ActionPlan[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  mergeCandidate: { nodeA: string; nodeB: string } | null;
  isGenerating: boolean;
  isSaving: boolean;

  setSession: (session: BrainstormSession) => void;
  setNodes: (nodes: IdeaNode[]) => void;
  addNode: (node: IdeaNode) => void;
  updateNode: (id: string, updates: Partial<IdeaNode>) => void;
  removeNode: (id: string) => void;
  setEdges: (edges: IdeaEdge[]) => void;
  addEdge: (edge: IdeaEdge) => void;
  setActionPlans: (plans: ActionPlan[]) => void;
  addActionPlan: (plan: ActionPlan) => void;
  selectNode: (id: string | null) => void;
  hoverNode: (id: string | null) => void;
  setMergeCandidate: (candidate: { nodeA: string; nodeB: string } | null) => void;
  setIsGenerating: (val: boolean) => void;
  setIsSaving: (val: boolean) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  nodes: [],
  edges: [],
  actionPlans: [],
  selectedNodeId: null,
  hoveredNodeId: null,
  mergeCandidate: null,
  isGenerating: false,
  isSaving: false,

  setSession: (session) => set({ session }),
  setNodes: (nodes) => set({ nodes }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.from_node_id !== id && e.to_node_id !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),
  setEdges: (edges) => set({ edges }),
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
  setActionPlans: (plans) => set({ actionPlans: plans }),
  addActionPlan: (plan) => set((state) => ({ actionPlans: [...state.actionPlans, plan] })),
  selectNode: (id) => set({ selectedNodeId: id }),
  hoverNode: (id) => set({ hoveredNodeId: id }),
  setMergeCandidate: (candidate) => set({ mergeCandidate: candidate }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  setIsSaving: (val) => set({ isSaving: val }),
  updateNodePosition: (id, x, y) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, position_x: x, position_y: y } : n
      ),
    })),
}));
