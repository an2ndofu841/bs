import type { IdeationMode, IdeaNodeType } from '@/types/database';

export interface GenerateIdeasInput {
  theme: string;
  goal: string;
  target?: string;
  constraints?: string;
  avoidRules?: string;
  mode: IdeationMode;
  count?: number;
}

export interface DeriveIdeaInput {
  parentTitle: string;
  parentDescription: string;
  action: string;
  mode: IdeationMode;
  context?: {
    theme: string;
    goal: string;
    target?: string;
  };
}

export interface MergeIdeasInput {
  ideaA: { title: string; description: string };
  ideaB: { title: string; description: string };
  mode: IdeationMode;
}

export interface PerspectiveInput {
  currentIdea: { title: string; description: string };
  perspectiveKey: string;
  perspectiveLabel: string;
  mode: IdeationMode;
}

export interface RescueInput {
  theme: string;
  goal: string;
  existingIdeas: { title: string; description: string }[];
  rescueType: string;
  mode: IdeationMode;
}

export interface ClusterInput {
  ideas: { id: string; title: string; description: string }[];
}

export interface ActionPlanInput {
  idea: { title: string; description: string };
  theme: string;
  goal: string;
  target?: string;
}

export interface MeetingSummaryInput {
  theme: string;
  goal: string;
  ideas: { title: string; description: string; type: IdeaNodeType; votes?: number }[];
  participants: string[];
}

export interface AIGeneratedIdea {
  title: string;
  description: string;
  type: IdeaNodeType;
}

export interface AIGeneratedActionPlan {
  summary: string;
  targetUser: string;
  valueProposition: string;
  steps: { order: number; title: string; detail: string }[];
  kpi: { metric: string; target: string }[];
  risks: { risk: string; mitigation: string }[];
  priority: 'high' | 'medium' | 'low';
}

export interface AIClusterResult {
  clusters: { key: string; label: string; ideaIds: string[] }[];
  gaps: string[];
  biases: string[];
}

export interface AIMeetingSummary {
  adoptedIdeas: string[];
  pendingIdeas: string[];
  keyInsights: string[];
  summary: string;
  nextSteps: string[];
}

export interface AIProvider {
  generateIdeas(input: GenerateIdeasInput): Promise<AIGeneratedIdea[]>;
  deriveIdea(input: DeriveIdeaInput): Promise<AIGeneratedIdea>;
  mergeIdeas(input: MergeIdeasInput): Promise<AIGeneratedIdea>;
  applyPerspective(input: PerspectiveInput): Promise<AIGeneratedIdea>;
  rescue(input: RescueInput): Promise<AIGeneratedIdea[]>;
  cluster(input: ClusterInput): Promise<AIClusterResult>;
  generateActionPlan(input: ActionPlanInput): Promise<AIGeneratedActionPlan>;
  generateMeetingSummary(input: MeetingSummaryInput): Promise<AIMeetingSummary>;
}
