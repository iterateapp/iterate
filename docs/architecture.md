# Iterate — アーキテクチャ設計

> 3つの独立したマイクロサービスが、TOMLファイルで連携する設計

---

## 全体構成

```
┌──────────────────────────────────────────────────────────┐
│  monorepo (Turborepo)                                     │
│                                                           │
│  apps/                                                    │
│    discovery/    ← Phase 1: 仮説生成チャット               │
│    research/     ← Phase 2: AIインタビューアプリ            │
│    action/       ← Phase 3: タスク生成・Linear連携          │
│    web/          ← ダッシュボード（オプション）              │
│                                                           │
│  packages/                                               │
│    toml-schema/  ← 共通TOMLスキーマ定義                    │
│    types/        ← 共通型定義                             │
└──────────────────────────────────────────────────────────┘
```

各サービスは**独立してデプロイ・使用可能**。TOMLファイルがサービス間の唯一のインターフェース。

---

## Phase 1: Discovery（仮説生成）

### 役割
PMがAIと対話しながら、定量データをもとに仮説を立て、構造化する。

### Input
- Amplitude / Mixpanel / GA4 などのanalyticsデータ（API連携 or CSVアップロード）
- PMの自由なテキスト（「このメトリクスが気になる」）

### Process
- Chat UIでAIとの対話（壁打ち形式）
- AIが問いかけ、PMが答えながら仮説を精緻化
- 仮説が固まったら、インタビュー設計 or A-Zテスト設計を自動生成

### Output
- `hypothesis.toml`（Phase 2 または Phase 3へのインプット）

### Human in the loop
- PMが仮説を修正・承認してからPhase 2に渡す

---

## Phase 2: Research（AIインタビュー）

### 役割
`hypothesis.toml` を元に、AIが実ユーザーにインタビューを実施する。

### Input
- `hypothesis.toml`（Phase 1の出力）

### Process
- in-appポップアップ or メールでユーザーを招待
- AIが会話形式でインタビューを実施（OpenAI Realtime API or テキストチャット）
- 複数ユーザーの回答を定性データとして集約・分析

### Output
- `results.toml`（Phase 3へのインプット）

### Human in the loop
- PMが結果サマリーをレビュー・承認してからPhase 3に渡す

---

## Phase 3: Action（タスク生成）

### 役割
`results.toml` を元に、実装タスクを生成してLinear/GitHub Issuesに登録する。

### Input
- `results.toml`（Phase 2の出力）

### Process
- AIがインタビュー結果から改善案を生成
- RICE（Impact / Confidence / Effort）スコアでタスクを優先順位付け
- OpenAI Symphony的なエージェントがLinear/GitHub APIを呼び出してタスクを作成

### Output
- Linear Issues / GitHub Issues / その他PMツールのタスク

### Human in the loop
- PMがタスクリストをレビュー・承認してから実際に作成する

---

## TOMLスキーマ定義

### `hypothesis.toml`（Phase 1 → Phase 2）

```toml
[meta]
id = "hyp-001"
created_at = "2026-03-08T12:00:00Z"
created_by = "pm@company.com"

[trigger]
source = "amplitude"                  # analytics data source
metric = "tab_b_ctr"
value = 0.008
threshold = 0.05                      # 期待値より低い
observation = "Tab BのCTRが期待値の6倍低い"

[hypothesis]
statement = "ユーザーがTab Bの存在に気づいていない可能性がある"
type = "discovery"                    # discovery | validation | a_z_test

[interview]
goal = "UI視認性の問題を確認する"
target_count = 50
questions = [
  "このページで普段使う機能を教えてください",
  "このタブ（Tab B）の存在に気づいていましたか？",
  "Tab Bを見つけた場合、どんな印象でしたか？",
]
target_segment = "active_users_30d"

[a_z_test]                            # インタビューの代わりにA-Zテストを設計する場合
enabled = false
variants = []
```

### `results.toml`（Phase 2 → Phase 3）

```toml
[meta]
id = "res-001"
hypothesis_id = "hyp-001"
completed_at = "2026-03-09T18:00:00Z"
total_interviews = 50

[summary]
key_insight = "ユーザーの78%がTab Bの存在に気づいていなかった"
confidence = 0.89
root_cause = "UIの視認性問題（コントラスト不足・位置）"

[findings]
awareness_rate = 0.22                 # Tab Bを知っていたユーザー比率
quotes = [
  "「え、こんなタブあったんですね」（インタビュー #12）",
  "「ずっと使ってますが気づかなかった」（インタビュー #31）",
]
themes = ["visibility", "discoverability", "contrast"]

[suggested_actions]

[[suggested_actions.items]]
title = "Tab Bのコントラスト改善"
description = "背景色とテキスト色のコントラスト比をWCAG AA基準（4.5:1）以上に"
impact = "high"
effort = "low"
confidence = 0.89

[[suggested_actions.items]]
title = "Tab Bに通知ドットを追加"
description = "初回ログイン時に赤いドットでTab Bの存在を示す"
impact = "medium"
effort = "low"
confidence = 0.76

[[suggested_actions.items]]
title = "Tab Bの配置を左側に移動"
description = "最も目に入る位置（左端）にTab Bを移動"
impact = "high"
effort = "medium"
confidence = 0.71
```

---

## サービス間フロー

```
Amplitude API
     │
     ▼
┌──────────────┐   hypothesis.toml   ┌──────────────┐
│  Discovery   │ ──────────────────▶ │   Research   │
│  (Phase 1)   │                     │   (Phase 2)  │
│  Chat UI     │ ◀── human review ─▶ │  AI Interview│
└──────────────┘                     └──────┬───────┘
                                            │ results.toml
                                            ▼
                                     ┌──────────────┐   Linear / GitHub
                                     │    Action    │ ──────────────────▶
                                     │   (Phase 3)  │   Issues / Tasks
                                     │ Task Gen     │
                                     └──────────────┘
```

### オプション: Phase 1 → Phase 3（インタビューをスキップ）

データが十分あり、仮説の確信度が高い場合は、Phase 2をスキップしてA-Zテストタスクを直接生成できる。

```
hypothesis.toml（type = "a_z_test"）
     │
     └──────────────────────────────▶ Action（Phase 3）
```

---

## 技術スタック（候補）

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 15（App Router）|
| モノレポ管理 | Turborepo + pnpm workspaces |
| DB | PostgreSQL（Supabase or Neon） |
| AI | Anthropic Claude API（Phase 1: 壁打ち、Phase 3: タスク生成）|
| AI Interview | OpenAI Realtime API or Claude（Phase 2） |
| TOML処理 | `@iarna/toml`（Node.js） |
| 外部連携 | Linear API, GitHub API, Amplitude API |
| デプロイ | Vercel |

---

## データフローの原則

1. **TOMLが唯一の真実**：サービス間はTOMLのみで通信。DBスキーマに依存しない
2. **Human in the loopはオプション**：各フェーズ間で人間の承認を挟むか自動で流すかを設定で切り替え
3. **各サービスは独立**：Phase 2だけをスタンドアロンのAIインタビューサービスとして外部提供することも可能
4. **監査可能**：すべてのTOMLファイルはバージョン管理可能（Gitで追える）

---

## 参考

- [overview.md](./overview.md) — プロダクトビジョン・ストーリー
- [competitive-research.md](./competitive-research.md) — 詳細な競合調査
