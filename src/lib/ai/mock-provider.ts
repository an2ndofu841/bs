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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MODE_TEMPLATES: Record<string, string[]> = {
  mass: [
    'アプリで管理する', 'サブスク化する', 'ゲーミフィケーション', 'コミュニティ化',
    'AIで自動化', 'シェアリング', 'マッチング', 'ランキング化', 'パーソナライズ',
    'UGC化', 'ライブ配信', 'マイクロラーニング',
  ],
  sharpen: [
    'ニッチに特化', 'プレミアム化', '限定感を出す', 'こだわりを見せる',
    '世界観を徹底', '専門家向け', 'カスタマイズ性', '一点突破',
  ],
  differentiate: [
    '競合と逆の方向', '新しい切り口', '意外な組み合わせ', '既存の常識を壊す',
    '別業界の仕組みを借りる', 'ターゲットを変える', 'ポジショニング変更',
  ],
  monetize: [
    'フリーミアム', 'マーケットプレイス手数料', 'SaaS月額', 'データ販売',
    'コンサル付き', 'ライセンス', '広告モデル', 'アップセル設計',
  ],
  realize: [
    'MVP化する', '最小構成で始める', '既存ツールで代替', 'ノーコードで作る',
    '段階的にリリース', 'パイロットユーザーで検証', '工数を半分にする',
  ],
  buzz: [
    'SNS映え要素', 'バイラル仕掛け', 'インフルエンサー活用', '話題性のあるネーミング',
    '限定オファー', 'ユーザー参加型', 'ストーリー性', 'サプライズ体験',
  ],
  customer_pain: [
    'どこで困っている？', '何に時間がかかる？', 'お金を払っても解決したい', '代替手段の不満',
    '感情的なペイン', '周りに言えない悩み', '日常の小さなストレス',
  ],
  worldview: [
    'ブランドストーリー', '共感を呼ぶビジョン', '美学を定義', 'トーン＆マナー',
    '理想の世界を描く', 'ファンコミュニティの文化', 'アイコニックなシンボル',
  ],
};

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export class MockAIProvider implements AIProvider {
  async generateIdeas(input: GenerateIdeasInput): Promise<AIGeneratedIdea[]> {
    await delay(800 + Math.random() * 400);
    const templates = MODE_TEMPLATES[input.mode] || MODE_TEMPLATES.mass;
    const count = input.count || 5;
    const selected = pickRandom(templates, Math.min(count, templates.length));

    return selected.map((template) => ({
      title: `${input.theme} × ${template}`,
      description: `「${input.theme}」を「${template}」の切り口で考えると、${input.goal}に向けた新しいアプローチが見えてきます。${input.target ? `${input.target}にとって` : ''}特に有効な方向性です。`,
      type: 'seed' as const,
    }));
  }

  async deriveIdea(input: DeriveIdeaInput): Promise<AIGeneratedIdea> {
    await delay(500 + Math.random() * 300);
    const actions: Record<string, (title: string) => { title: string; description: string }> = {
      sharpen: (t) => ({ title: `${t}【尖鋭化】`, description: `「${t}」の最もユニークな部分だけに絞り込み、圧倒的な差別化ポイントを作ります。` }),
      realistic: (t) => ({ title: `${t}【現実化】`, description: `「${t}」を今すぐ始められる最小構成に落とし込みます。まず1週間で検証できる形にします。` }),
      reverse: (t) => ({ title: `${t}【真逆発想】`, description: `「${t}」の前提を全て逆にしてみると？全く新しい可能性が見えてきます。` }),
      target_change: (t) => ({ title: `${t}【ターゲット転換】`, description: `「${t}」を全く別の層に届けたら？意外なマーケットが見つかるかもしれません。` }),
      monetize: (t) => ({ title: `${t}【収益化】`, description: `「${t}」でお金を生むには？複数のマネタイズモデルを検討します。` }),
      sns: (t) => ({ title: `${t}【SNS最適化】`, description: `「${t}」をSNSで拡散されやすい形に変換します。シェアしたくなる仕掛けを入れます。` }),
      naming: (t) => ({ title: `${t}のネーミング案`, description: `「${t}」を一言で表すキャッチーな名前。覚えやすく、検索しやすく、世界観が伝わるもの。` }),
      mvp: (t) => ({ title: `${t}【MVP設計】`, description: `「${t}」の核となる価値だけを残し、最速でリリースできる形にします。` }),
      lp: (t) => ({ title: `${t}【LP構成案】`, description: `「${t}」を紹介するランディングページの構成。ファーストビューで価値が伝わる設計。` }),
      action: (t) => ({ title: `${t}【実行計画】`, description: `「${t}」を実行に移すためのステップバイステップの計画。` }),
    };

    const actionFn = actions[input.action] || actions.sharpen;
    const result = actionFn(input.parentTitle);

    return {
      title: result.title,
      description: result.description,
      type: 'sprout',
    };
  }

  async mergeIdeas(input: MergeIdeasInput): Promise<AIGeneratedIdea> {
    await delay(600 + Math.random() * 300);
    return {
      title: `${input.ideaA.title} ✕ ${input.ideaB.title}`,
      description: `「${input.ideaA.title}」と「${input.ideaB.title}」を組み合わせた新しいコンセプト。両者の強みを活かし、単独では到達できなかった領域に踏み込みます。`,
      type: 'card',
    };
  }

  async applyPerspective(input: PerspectiveInput): Promise<AIGeneratedIdea> {
    await delay(500 + Math.random() * 300);
    return {
      title: `${input.currentIdea.title}【${input.perspectiveLabel}】`,
      description: `「${input.currentIdea.title}」を「${input.perspectiveLabel}」の視点で再解釈。${input.currentIdea.description}を踏まえつつ、新しい方向性を提示します。`,
      type: 'sprout',
    };
  }

  async rescue(input: RescueInput): Promise<AIGeneratedIdea[]> {
    await delay(700 + Math.random() * 400);
    const rescueTemplates: Record<string, { title: string; description: string }[]> = {
      stuck: [
        { title: '全く違う業界から学ぶ', description: '飲食、ファッション、ゲーム、医療...異業種のアイディアを転用してみましょう。' },
        { title: '問題の定義自体を変える', description: '本当に解くべき課題はそこですか？一歩引いて問い直してみましょう。' },
      ],
      weird: [
        { title: 'あえて非効率にしてみる', description: '効率化の逆。手間をかけることで生まれる価値は？' },
        { title: '100年後の人が使うとしたら？', description: '未来視点で今の常識を壊してみましょう。' },
      ],
      too_serious: [
        { title: 'お祭りにする', description: 'イベント感、ライブ感、エンタメ要素を足してみましょう。' },
        { title: 'ミーム化できないか？', description: 'つい人に話したくなる、面白い切り口は？' },
      ],
      more_sellable: [
        { title: '今日から課金できる形', description: '最小単位でも「買いたい」と思える形は？' },
        { title: 'トップ3の競合ができないことは？', description: '独自のポジショニングを見つけましょう。' },
      ],
      broaden: [
        { title: '対象を10倍にする', description: 'もしユーザーが10倍いたら何が変わる？' },
        { title: '関連する5つの市場', description: `${input.theme}に隣接する市場から新しい切り口を探します。` },
      ],
      steal_from_others: [
        { title: '海外の成功事例を日本版に', description: '海外で流行っているサービスを日本市場に最適化。' },
        { title: 'アナログの仕組みをデジタル化', description: 'オフラインで上手くいっていることをオンラインへ。' },
      ],
      reverse: [
        { title: 'ターゲットの真逆の人向け', description: '想定ユーザーの対極にいる人に売るなら？' },
        { title: '最高のものを最低価格で', description: 'プレミアムなものを民主化する発想。' },
      ],
    };

    const templates = rescueTemplates[input.rescueType] || rescueTemplates.stuck;
    return templates.map(t => ({
      title: `${input.theme}: ${t.title}`,
      description: t.description,
      type: 'seed' as const,
    }));
  }

  async cluster(input: ClusterInput): Promise<AIClusterResult> {
    await delay(600 + Math.random() * 300);
    const clusterCount = Math.min(Math.ceil(input.ideas.length / 3), 5);
    const clusters: AIClusterResult['clusters'] = [];
    const clusterLabels = ['コア機能系', 'マーケティング系', '技術・実装系', 'ユーザー体験系', 'ビジネスモデル系'];
    const shuffledIdeas = [...input.ideas].sort(() => Math.random() - 0.5);

    for (let i = 0; i < clusterCount; i++) {
      const start = Math.floor(i * shuffledIdeas.length / clusterCount);
      const end = Math.floor((i + 1) * shuffledIdeas.length / clusterCount);
      clusters.push({
        key: `cluster_${i}`,
        label: clusterLabels[i] || `グループ ${i + 1}`,
        ideaIds: shuffledIdeas.slice(start, end).map(idea => idea.id),
      });
    }

    return {
      clusters,
      gaps: ['ユーザー獲得戦略が不足', '技術的な実現方法の検討が必要', '競合分析の視点が弱い'],
      biases: ['機能追加に偏りがち', 'BtoC寄りの発想が多い'],
    };
  }

  async generateActionPlan(input: ActionPlanInput): Promise<AIGeneratedActionPlan> {
    await delay(800 + Math.random() * 400);
    return {
      summary: `「${input.idea.title}」を実行可能な施策として整理しました。${input.goal}の達成に向けて、段階的に進められる計画です。`,
      targetUser: input.target || '主要ターゲットユーザー',
      valueProposition: `${input.idea.description}を通じて、ユーザーの課題を解決し、新しい価値を提供します。`,
      steps: [
        { order: 1, title: '市場調査・競合分析', detail: '1-2週間で主要競合と市場機会を調査' },
        { order: 2, title: 'コンセプト検証', detail: 'ターゲット5-10名にヒアリング、ニーズ検証' },
        { order: 3, title: 'MVP設計・開発', detail: '最小機能でプロトタイプを2-4週間で作成' },
        { order: 4, title: 'ベータテスト', detail: '20-50名の限定ユーザーでテスト運用' },
        { order: 5, title: '本格ローンチ', detail: 'フィードバック反映後、正式リリース' },
      ],
      kpi: [
        { metric: '初月ユーザー数', target: '100名' },
        { metric: '継続利用率', target: '40%以上' },
        { metric: 'NPS', target: '50以上' },
      ],
      risks: [
        { risk: 'ユーザーニーズとのズレ', mitigation: '早期にユーザーテストを実施し、ピボット判断を素早く行う' },
        { risk: '開発工数の膨張', mitigation: 'MVP機能を厳選し、追加機能は検証後に判断' },
        { risk: '競合の参入', mitigation: '独自の強みを明確にし、先行者優位を確保' },
      ],
      priority: 'high',
    };
  }

  async generateMeetingSummary(input: MeetingSummaryInput): Promise<AIMeetingSummary> {
    await delay(700 + Math.random() * 300);
    const sortedIdeas = [...input.ideas].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const topIdeas = sortedIdeas.slice(0, 3);
    const restIdeas = sortedIdeas.slice(3, 6);

    return {
      adoptedIdeas: topIdeas.map(i => i.title),
      pendingIdeas: restIdeas.map(i => i.title),
      keyInsights: [
        `${input.theme}に関して${input.ideas.length}個のアイディアが出されました`,
        `参加者${input.participants.length}名で活発な議論が行われました`,
        `最も注目を集めたのは「${topIdeas[0]?.title || input.theme}」の方向性です`,
      ],
      summary: `「${input.theme}」をテーマに、${input.goal}を目指すブレストが実施されました。合計${input.ideas.length}個のアイディアが出され、特に上位の案は実行可能性が高いと評価されています。`,
      nextSteps: [
        '採用案の詳細設計を来週までに完了',
        '担当者アサインと実行スケジュール策定',
        '保留案は次回のブレストで再検討',
      ],
    };
  }
}
