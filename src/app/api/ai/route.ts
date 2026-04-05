import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    const ai = getAIProvider();
    let result: unknown;

    switch (action) {
      case 'generate':
        result = await ai.generateIdeas(params);
        break;
      case 'derive':
        if (params.deriveAction) {
          params.action = params.deriveAction;
          delete params.deriveAction;
        }
        result = await ai.deriveIdea(params);
        break;
      case 'merge':
        result = await ai.mergeIdeas(params);
        break;
      case 'perspective':
        result = await ai.applyPerspective(params);
        break;
      case 'rescue':
        result = await ai.rescue(params);
        break;
      case 'cluster':
        result = await ai.cluster(params);
        break;
      case 'actionPlan':
        result = await ai.generateActionPlan(params);
        break;
      case 'meetingSummary':
        result = await ai.generateMeetingSummary(params);
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI API error:', message, error);
    return NextResponse.json(
      { error: `AI processing failed: ${message}` },
      { status: 500 }
    );
  }
}
