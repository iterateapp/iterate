# Iterate 競合・参考リサーチレポート

> 調査日: 2026-03-08

## プロジェクト理解

**Iterate** = 定量（analytics）＋ 定性（インタビュー）→ 課題発見 → 仕様 → 実装 → 実験 の**AIクローズドループPMツール**

---

## 1. 直接競合（最も近い）

### AI Product Discovery / Strategy

| サービス | 特徴 | 資金/規模 |
|---------|------|----------|
| [Zeda.io](https://zeda.io/) | VoC＋analytics統合、Ask AI、Opportunity Radar。Iterateに最も近い概念 | $499/月〜（高い） |
| [Productboard Spark](https://www.productboard.com/product/spark/) | AI-first agentic PM agent。2025年10月ベータ開始。PRD・ロードマップ生成 | 既存大手が参入 |
| [Nalvin](https://www.nalvin.com/) | AI Agents for Product Teams。Feedback Flywheelコンセプトを提唱 | 小規模スタートアップ |

### AI User Interview / Qualitative Research

| サービス | 特徴 | 資金/規模 |
|---------|------|----------|
| [Outset](https://outset.ai/) | AI-moderated interview。$30M Series B（2025/12）、8x売上成長、YC出身 | $51M調達済 |
| [Listen Labs](https://listenlabs.ai) | AI-led user interviews at scale | 成長中 |
| [Strella](https://www.strella.io/) | AI customer research platform | ステルス〜初期 |
| [Conveo](https://conveo.ai/) | 定量＋定性ハイブリッド（YC S25バッチにも登場） | YCバッチ |
| [Kraftful](https://www.kraftful.com/) | マルチソースfeedback分析、AI interview機能 → **2025/7にAmplitudeが買収** | 買収済 |

### Feedback / Insight統合

| サービス | 特徴 |
|---------|------|
| [Sprig](https://sprig.com/) | analytics+survey+replay統合。$330M評価額。Figma・Notionが利用 |
| [Dovetail](https://dovetailapp.com/) | AI-native customer intelligence hub。定性データ分析に強い |
| [HeyMarvin](https://heymarvin.com/) | AI-native customer insights。40言語対応 |
| [BuildBetter](https://blog.buildbetter.ai/) | コール・チケット・サーベイをinsightに変換。18h/sprint節約 |

---

## 2. 隣接競合（部分的に重なる）

| サービス | 重なる領域 |
|---------|-----------|
| [ChatPRD](https://www.chatprd.ai/) | AI PRD生成（仕様生成部分） |
| [Amplitude](https://amplitude.com/) | 定量analytics（Kraftful買収でqualitative統合中） |
| [Pendo](https://pendo.io/) | 行動analytics + in-app guidance |
| [Maze](https://maze.co/) | usability testing + AI analysis |
| [Innerview](https://innerview.co/) | interview → insightの変換 |

---

## 3. オープンソース / GitHub

| リポジトリ | 概要 |
|-----------|------|
| [MetaGPT](https://github.com/FoundationAgents/MetaGPT) | 1行のrequirementからPRD・設計・コードまで生成するマルチエージェント。PM・Architect・Engineerロールを内包。2025/2にMGX(no-code版)ローンチ |
| [GPT Researcher](https://github.com/assafelovic/gpt-researcher) | 深掘り調査エージェント。discovery phaseの参考 |
| [awesome-ai-agents (e2b-dev)](https://github.com/e2b-dev/awesome-ai-agents) | AI agentリスト（アーキテクチャ参考） |
| [Product-Manager-Skills (deanpeters)](https://github.com/deanpeters/Product-Manager-Skills) | Claude Code / Codex向けPMスキルフレームワーク |

---

## 4. 重要な業界記事・ブログ

### VC投資thesis（参入機会の根拠として使える）

- **[Greylock: The Rise of AI-Native User Research](https://greylock.com/greymatter/ai-user-research/)** ← **最重要**
  2025/6/10公開。「今がAI-native user research platformを作る最高のタイミング」と明言。founders募集中（sophia@greylock.com）

- **[a16z: State of Consumer AI 2025](https://a16z.com/state-of-consumer-ai-2025-product-hits-misses-and-whats-next/)**
  AI-native focused toolsがwinner、big teamsは後手

### 市場トレンド記事

- **[LogRocket: 3 AI shockwaves reshaping product management in 2026](https://blog.logrocket.com/product-management/ai-changes-product-management-2026)**
  「2026年はPMがAIなしでは競争できない最初の年」

- **[O'Reilly: The Future of Product Management Is AI-Native](https://www.oreilly.com/radar/the-future-of-product-management-is-ai-native/)**
  Impact Loopへの移行（タスク消化 → KPI改善速度で測定）

- **[Nalvin: The Feedback Flywheel](https://www.nalvin.com/blog/the-feedback-flywheel-how-ai-creates-a-self-improving-product-ecosystem)**
  Iterateのflywheelコンセプトと同じ発想。競合ブログとして参考に

- **[Calibre Labs: Building an AI Product Flywheel](https://blog.calibrelabs.ai/p/building-an-ai-product-flywheel)**
  AI Product Flywheelの構築論。Iterateの理論的基盤として使える

- **[aipmtools.org: Future of AI in PM 2026-2030](https://aipmtools.org/articles/future-of-ai-product-management)**
  「Agentic dimensionがすべてのツールで最低スコア」→ Iterateの差別化ポイント

- **[ProdMoh: Future of AI-Native Product Organizations](https://prodmoh.com/blog/future-of-ai-native-product-organizations)**
  2026-2030展望。Impact Loopとagentic workflowの台頭

### Medium記事

- **[Aakash Gupta: AI Product Management](https://aakashgupta.medium.com/ai-product-management-the-500k-career-opportunity-hiding-in-plain-sight-9b1ebdcf361f)**
  AI PM需要の高まり。Iterateの市場背景として使える

---

## 5. Hacker News 注目スレッド

- **[Don't build AI products the way everyone else is doing it](https://news.ycombinator.com/item?id=38221552)**
  AI製品のdifferentiationに関するHN議論

- **[Andrew Ng: bottleneck isn't coding – it's product management](https://news.ycombinator.com/item?id=45044155)**
  Iterateのピッチの核心と完全に一致。「ボトルネックはコードではなく、何を作るかだ」

- **[Ask HN: What are you working on (August 2025)?](https://news.ycombinator.com/item?id=45027862)**
  YC系startupの最新動向チェックに

---

## 6. 競合ポジショニング整理

```
         │ 定量(analytics)統合
         │     高
         │
Sprig    │  Iterate(目標)   ←── ここを目指す
Pendo    │
         │
Dovetail │      Zeda.io
         │   Productboard
         │
         └──────────────────────── 定性(interview)統合
              低              高
```

---

## 7. Iterateの差別化ポイント（調査から見えたもの）

1. **既存ツールはどれも「部分解」** — analytics専門、interview専門、PRD専門に分かれている。定量＋定性の統合から仕様→実装→実験まで one-loop でやるのはIterateだけ

2. **agentic dimensionが業界最弱点** — aipmtools.orgの調査で、全ツールで「自律実行能力」が最低スコア。ここがIterateの勝機

3. **Greylock / a16zが積極的に投資を探している** — まさに今が参入タイミング

4. **Andrew Ng発言がIterateのピッチと完全一致** — 「ボトルネックはコードではなくPM」がHNでバズ済み。ナラティブとして最強

5. **Kraftful（類似サービス）がAmplitudeに買収** — 2025/7。マーケットの大企業からの需要証明

---

## 8. 参考UIデザイン（Linear/Vercel/Cursor風）

- **[Linear](https://linear.app/)** — 審査員が好きなデザインの筆頭。$1.25B評価額、18,000+ paying customers
- **[Vercel Dashboard](https://vercel.com/)** — Series F $300M、$9.3B評価額
- **[Cursor](https://cursor.com/)** — $29.3B評価額（2025/11）

この3社はすでにinterconnectedなエコシステムを形成。Iterateはこのスタックの「上流」（何を作るか）を担う位置づけ。
