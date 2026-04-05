export type IdeaNodeType = 'seed' | 'sprout' | 'card' | 'action_plan';
export type IdeaSourceType = 'manual' | 'ai' | 'merged' | 'perspective' | 'rescue' | 'participant';
export type EdgeType = 'derived' | 'merged' | 'related';
export type SessionType = 'solo' | 'shared';
export type SessionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type ParticipantRole = 'facilitator' | 'participant' | 'viewer';
export type InputType = 'idea' | 'reaction' | 'vote' | 'comment';
export type IdeationMode = 'mass' | 'sharpen' | 'differentiate' | 'monetize' | 'realize' | 'buzz' | 'customer_pain' | 'worldview';
export type ActionPriority = 'high' | 'medium' | 'low';

export interface BrainstormSession {
  id: string;
  user_id: string;
  title: string;
  theme: string;
  goal: string;
  target: string | null;
  constraints: string | null;
  avoid_rules: string | null;
  mode: IdeationMode;
  session_type: SessionType;
  status: SessionStatus;
  share_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaNode {
  id: string;
  session_id: string;
  parent_id: string | null;
  type: IdeaNodeType;
  title: string;
  description: string;
  position_x: number;
  position_y: number;
  cluster_key: string | null;
  source_type: IdeaSourceType;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IdeaEdge {
  id: string;
  session_id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: EdgeType;
}

export interface PerspectiveCard {
  id: string;
  key: string;
  label: string;
  description: string;
}

export interface ActionPlan {
  id: string;
  session_id: string;
  node_id: string;
  summary: string;
  target_user: string;
  value_proposition: string;
  steps: { order: number; title: string; detail: string }[];
  kpi: { metric: string; target: string }[];
  risks: { risk: string; mitigation: string }[];
  priority: ActionPriority;
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string | null;
  display_name: string;
  role: ParticipantRole;
  joined_at: string;
}

export interface ParticipantInput {
  id: string;
  session_id: string;
  participant_id: string;
  content: string;
  input_type: InputType;
  target_node_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const IDEATION_MODE_LABELS: Record<IdeationMode, { label: string; description: string; emoji: string }> = {
  mass: { label: '量産', description: 'とにかく数を出す', emoji: '🌊' },
  sharpen: { label: '尖らせる', description: '独自性を磨く', emoji: '⚡' },
  differentiate: { label: '差別化', description: '競合と違う視点で', emoji: '🎯' },
  monetize: { label: '収益化', description: 'お金になる方向で', emoji: '💰' },
  realize: { label: '現実化', description: '実現可能な形に', emoji: '🔧' },
  buzz: { label: 'バズ', description: '話題になる方向で', emoji: '🔥' },
  customer_pain: { label: '顧客課題', description: 'ペインから考える', emoji: '🎪' },
  worldview: { label: '世界観', description: 'ブランドの世界を作る', emoji: '🌍' },
};

export const IDEA_NODE_TYPE_CONFIG: Record<IdeaNodeType, { label: string; emoji: string; color: string }> = {
  seed: { label: '種', emoji: '🌱', color: 'emerald' },
  sprout: { label: '芽', emoji: '🌿', color: 'green' },
  card: { label: 'カード', emoji: '💡', color: 'amber' },
  action_plan: { label: '実行案', emoji: '🚀', color: 'blue' },
};
