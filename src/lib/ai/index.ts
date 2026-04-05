import type { AIProvider } from './types';
import { MockAIProvider } from './mock-provider';

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    provider = new MockAIProvider();
  }
  return provider;
}

export type { AIProvider } from './types';
export type {
  GenerateIdeasInput,
  DeriveIdeaInput,
  MergeIdeasInput,
  PerspectiveInput,
  RescueInput,
  ClusterInput,
  ActionPlanInput,
  MeetingSummaryInput,
  AIGeneratedIdea,
  AIGeneratedActionPlan,
  AIClusterResult,
  AIMeetingSummary,
} from './types';
