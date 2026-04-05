import type { AIProvider } from './types';
import { MockAIProvider } from './mock-provider';
import { OpenAIProvider } from './openai-provider';

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      provider = new OpenAIProvider(apiKey, model);
      console.log(`[AI] Using OpenAI provider (model: ${model})`);
    } else {
      provider = new MockAIProvider();
      console.log('[AI] Using mock provider (set OPENAI_API_KEY to use OpenAI)');
    }
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
