# ⚡ IdeaForge - 最強で最高に楽しいブレストツール

アイディアを **触って増やし、育て、整理し、実行案まで落とし込める** 次世代のブレストツール。

## コンセプト

「書くUIではなく、ひらめきを触って増やすUI」

空白画面に向かって考え込むのではなく、画面上にあるアイディアの種やカードを触っているうちに、アイディアが連鎖的に増え、育ち、整理されていく体験。

## 主要機能

- 🌱 **アイディア生成** - テーマを入力するだけでAIが種を生成
- 🌿 **派生・深掘り** - ワンタップで尖らせる、現実化する、真逆にするなど10種類のアクション
- ✨ **掛け合わせ** - アイディア同士を組み合わせて新発想
- 🃏 **視点カード** - 15種類の視点カードでブレイクスルー
- 🆘 **行き詰まり救済** - 7種類の救済ボタンで思考を打開
- 🗂️ **自動クラスタリング** - AIが類似案を整理、偏りも可視化
- 🚀 **実行案化** - アイディアをKPI付き施策に変換
- 👥 **共有モード** - リアルタイムで複数人ブレスト
- 📝 **会議サマリー** - AI要約・採用案整理

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| アニメーション | Framer Motion |
| 状態管理 | Zustand |
| 認証 | Supabase Auth |
| DB | Supabase Postgres |
| リアルタイム | Supabase Realtime |
| デプロイ | Vercel |
| AI | 抽象化レイヤー (MVP: モック / 将来: OpenAI等) |

## セットアップ

### 前提条件

- Node.js 18+
- Supabase プロジェクト
- Vercel アカウント (デプロイ時)

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して、Supabaseの情報を設定:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase データベースセットアップ

Supabaseダッシュボードの SQL Editor で `supabase/schema.sql` を実行:

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. SQL Editor を開く
4. `supabase/schema.sql` の内容を貼り付けて実行

### 4. Supabase Auth の設定

1. Supabase Dashboard → Authentication → Providers
2. Email プロバイダーを有効化
3. Site URL を設定 (`http://localhost:3000` / 本番URL)
4. Redirect URLs に `http://localhost:3000/auth/callback` を追加

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## Vercel デプロイ

### 1. Vercel にプロジェクトをインポート

```bash
npx vercel
```

または [Vercel Dashboard](https://vercel.com) から GitHub リポジトリを接続

### 2. 環境変数を設定

Vercel の Project Settings → Environment Variables に以下を設定:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. デプロイ

```bash
npx vercel --prod
```

### 4. Supabase の Redirect URL を更新

Supabase Dashboard → Authentication → URL Configuration で、本番URLを追加:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # ランディングページ
│   ├── auth/              # 認証ページ
│   ├── dashboard/         # ダッシュボード
│   ├── session/           # セッション関連
│   │   ├── new/           # 新規作成
│   │   └── [id]/          # セッション詳細
│   │       ├── solo/      # ソロブレスト
│   │       ├── shared/    # 共有モード
│   │       ├── organize/  # 整理画面
│   │       ├── action-plan/ # 実行案
│   │       └── summary/   # サマリー
│   └── api/               # API Routes
│       └── ai/            # AI処理エンドポイント
├── components/
│   ├── ui/                # 共通UIコンポーネント
│   └── canvas/            # キャンバス関連
├── lib/
│   ├── ai/                # AI抽象化レイヤー
│   ├── supabase/          # Supabaseクライアント
│   └── utils/             # ユーティリティ
├── stores/                # Zustand ストア
└── types/                 # TypeScript型定義
```

## AI レイヤー

AIロジックは `src/lib/ai/` に抽象化されています。

- `types.ts` - インターフェース定義
- `mock-provider.ts` - モックAIプロバイダー (MVP用)
- `index.ts` - プロバイダーファクトリ

OpenAI等のLLMに接続する場合は、`AIProvider` インターフェースを実装した新しいプロバイダーを作成し、`index.ts` のファクトリを切り替えるだけで対応できます。

## 発想モード

| モード | 説明 |
|--------|------|
| 🌊 量産 | とにかく数を出す |
| ⚡ 尖らせる | 独自性を磨く |
| 🎯 差別化 | 競合と違う視点で |
| 💰 収益化 | お金になる方向で |
| 🔧 現実化 | 実現可能な形に |
| 🔥 バズ | 話題になる方向で |
| 🎪 顧客課題 | ペインから考える |
| 🌍 世界観 | ブランドの世界を作る |

## ライセンス

MIT
