import OpenAI from 'openai';
import { IDEATION_MODE_LABELS } from '@/types/database';
import type {
  AIProvider,
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

const SYSTEM_PROMPT = `あなたは最高のブレインストーミングパートナーです。
ユーザーのアイディアを否定せず、常にポジティブに発展させます。
弱い案でも「まだ種」として育てる姿勢で返答してください。

重要なルール:
- 否定しない。「弱い」ではなく「育てるなら？」と返す
- 具体的で実行可能な方向性を示す
- 短く端的に（タイトルは20文字以内、説明は80文字以内）
- 必ず指定されたJSON形式で返す
- 日本語で回答する`;

function modeContext(mode: string): string {
  const config = IDEATION_MODE_LABELS[mode as keyof typeof IDEATION_MODE_LABELS];
  if (!config) return '';
  return `発想モード: ${config.label}（${config.description}）。このモードに沿った案を出してください。`;
}

function parseJSON<T>(text: string): T {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = match ? match[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

async function chat(openai: OpenAI, userPrompt: string, model: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 2000,
  });
  return res.choices[0]?.message?.content || '';
}

export class OpenAIProvider implements AIProvider {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateIdeas(input: GenerateIdeasInput): Promise<AIGeneratedIdea[]> {
    const count = input.count || 5;
    const prompt = `テーマ: ${input.theme}
目的: ${input.goal}
${input.target ? `ターゲット: ${input.target}` : ''}
${input.constraints ? `制約: ${input.constraints}` : ''}
${input.avoidRules ? `避けたいこと: ${input.avoidRules}` : ''}
${modeContext(input.mode)}

上記テーマについてブレストして、${count}個のアイディアの種を出してください。
多様な角度から、意外性のある案も混ぜてください。

以下のJSON配列で返してください:
[{"title": "短いタイトル", "description": "1-2文の説明", "type": "seed"}]`;

    const text = await chat(this.openai, prompt, this.model);
    return parseJSON<AIGeneratedIdea[]>(text);
  }

  async deriveIdea(input: DeriveIdeaInput): Promise<AIGeneratedIdea> {
    const actionLabels: Record<string, string> = {
      sharpen: 'もっと尖らせて、独自性を最大化する',
      realistic: '今すぐ始められる現実的な形に落とし込む',
      reverse: '前提を全て逆転させて、全く新しい方向を見つける',
      target_change: 'ターゲットを全く別の層に変えてみる',
      monetize: '収益モデルを具体的に設計する',
      sns: 'SNSでバズる・シェアされる形に変換する',
      naming: 'キャッチーで3秒で伝わる名前を考える',
      mvp: '最小限の機能で最速リリースできる形にする',
      lp: 'ランディングページの構成案として整理する',
      action: '具体的な実行ステップに変換する',
      worldview: '独自の世界観やストーリーを付与する',
      story: '物語として語れるストーリー構造を組み立てる',
      character: 'マスコットやキャラクターを設定してブランド化する',
      weakness_flip: '弱点や欠点を逆に最大の強みに変える',
      subscription: 'サブスクリプション型の継続モデルに変換する',
      ai_service: 'AI/自動化を軸にしたサービスとして再設計する',
      cross_industry: '全く別の業界（飲食・医療・ゲーム等）に転用する',
      broaden: '対象範囲を大きく広げて、より多くの人に届く形にする',
    };

    const actionDesc = actionLabels[input.action] || input.action;

    const prompt = `元のアイディア:
タイトル: ${input.parentTitle}
説明: ${input.parentDescription}
${input.context ? `テーマ: ${input.context.theme}\n目的: ${input.context.goal}` : ''}
${modeContext(input.mode)}

このアイディアを「${actionDesc}」方向で派生させてください。
元の案を活かしつつ、新しい価値を加えてください。

以下のJSON形式で返してください:
{"title": "派生タイトル", "description": "1-2文の説明", "type": "sprout"}`;

    const text = await chat(this.openai, prompt, this.model);
    return parseJSON<AIGeneratedIdea>(text);
  }

  async mergeIdeas(input: MergeIdeasInput): Promise<AIGeneratedIdea> {
    const prompt = `2つのアイディアを掛け合わせて、新しいコンセプトを生成してください。
${modeContext(input.mode)}

アイディアA:
タイトル: ${input.ideaA.title}
説明: ${input.ideaA.description}

アイディアB:
タイトル: ${input.ideaB.title}
説明: ${input.ideaB.description}

両者の強みを活かした、単独では到達できない新しいアイディアを1つ作ってください。

以下のJSON形式で返してください:
{"title": "掛け合わせタイトル", "description": "1-2文の説明", "type": "card"}`;

    const text = await chat(this.openai, prompt, this.model);
    return parseJSON<AIGeneratedIdea>(text);
  }

  async applyPerspective(input: PerspectiveInput): Promise<AIGeneratedIdea> {
    const prompt = `元のアイディア:
タイトル: ${input.currentIdea.title}
説明: ${input.currentIdea.description}

視点カード: ${input.perspectiveLabel}
${modeContext(input.mode)}

この視点を適用して、アイディアを新しい方向に展開してください。
元の案の良い部分は残しつつ、視点カードの切り口で変化を加えてください。

以下のJSON形式で返してください:
{"title": "新しいタイトル", "description": "1-2文の説明", "type": "sprout"}`;

    const text = await chat(this.openai, prompt, this.model);
    return parseJSON<AIGeneratedIdea>(text);
  }

  async rescue(input: RescueInput): Promise<AIGeneratedIdea[]> {
    const rescuePrompts: Record<string, string> = {
      stuck: '完全に新しい角度から、既存のアイディアとは全く違う切り口で2つ提案してください。',
      weird: '常識はずれで、ちょっとクレイジーだけど面白い案を2つ出してください。ぶっ飛んでOK。',
      too_serious: '遊び心やエンタメ要素を入れた、ワクワクする案を2つ出してください。',
      more_sellable: 'すぐに売上に繋がる、ビジネスとして強い案を2つ出してください。',
      broaden: '対象を大きく広げたり、全く違う市場に展開する案を2つ出してください。',
      steal_from_others: '他業界（飲食、ゲーム、医療、ファッション等）の成功パターンを転用した案を2つ出してください。',
      reverse: '既存アイディアの前提を全てひっくり返した逆転の発想を2つ出してください。',
    };

    const rescueDesc = rescuePrompts[input.rescueType] || rescuePrompts.stuck;

    const existingList = input.existingIdeas.map(i => `- ${i.title}`).join('\n');

    const prompt = `テーマ: ${input.theme}
目的: ${input.goal}
${modeContext(input.mode)}

既存のアイディア:
${existingList || '（まだなし）'}

行き詰まり救済モード！
${rescueDesc}

以下のJSON配列で返してください:
[{"title": "タイトル", "description": "1-2文の説明", "type": "seed"}]`;

    const text = await chat(this.openai, prompt, this.model);
    return parseJSON<AIGeneratedIdea[]>(text);
  }

  async cluster(input: ClusterInput): Promise<AIClusterResult> {
    const ideasList = input.ideas.map(i => `[${i.id}] ${i.title}: ${i.description}`).join('\n');

    const prompt = `以下のアイディア一覧をテーマ別に3〜5グループにクラスタリングしてください。
また、不足している視点と、思考の偏りも分析してください。

アイディア一覧:
${ideasList}

以下のJSON形式で返してください:
{
  "clusters": [{"key": "cluster_0", "label": "グループ名", "ideaIds": ["id1", "id2"]}],
  "gaps": ["不足している視点1", "不足している視点2"],
  "biases": ["偏り1", "偏り2"]
}`;

    const text = await chat(this.openai, prompt, this.model);
    return parseJSON<AIClusterResult>(text);
  }

  async generateActionPlan(input: ActionPlanInput): Promise<AIGeneratedActionPlan> {
    const prompt = `以下のアイディアを実行可能な施策に変換してください。

アイディア: ${input.idea.title}
説明: ${input.idea.description}
テーマ: ${input.theme}
目的: ${input.goal}
${input.target ? `ターゲット: ${input.target}` : ''}

以下のJSON形式で返してください:
{
  "summary": "企画概要（2-3文）",
  "targetUser": "具体的なターゲットユーザー",
  "valueProposition": "提供する価値",
  "steps": [{"order": 1, "title": "ステップ名", "detail": "具体的な内容"}],
  "kpi": [{"metric": "指標名", "target": "目標値"}],
  "risks": [{"risk": "リスク内容", "mitigation": "対策"}],
  "priority": "high"
}

stepsは5つ、kpiは3つ、risksは3つ程度で。priorityはhigh/medium/lowから選択。`;

    const text = await chat(this.openai, prompt, this.model);
    return parseJSON<AIGeneratedActionPlan>(text);
  }

  async generateMeetingSummary(input: MeetingSummaryInput): Promise<AIMeetingSummary> {
    const ideasList = input.ideas
      .map(i => `- ${i.title}（${i.type}${i.votes ? `、投票${i.votes}` : ''}）`)
      .join('\n');

    const prompt = `以下のブレスト会議を要約してください。

テーマ: ${input.theme}
目的: ${input.goal}
参加者: ${input.participants.join('、')}
出されたアイディア:
${ideasList}

以下のJSON形式で返してください:
{
  "adoptedIdeas": ["採用すべき上位3案のタイトル"],
  "pendingIdeas": ["保留・要検討の案のタイトル"],
  "keyInsights": ["会議の重要なインサイト3つ"],
  "summary": "会議全体の要約（3-4文）",
  "nextSteps": ["次にやるべきこと3つ"]
}`;

    const text = await chat(this.openai, prompt, this.model);
    return parseJSON<AIMeetingSummary>(text);
  }
}
