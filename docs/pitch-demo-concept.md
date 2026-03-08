# Iterate ピッチデモ構成メモ

グループチャットで議論した90秒デモ動画の構成と演出まとめ。

---

## プロダクト概要

**PM向けAIプロダクト「Iterate」**

コンセプト: AIが"何を作るべきか"を決める

ユーザーデータ（定量）＋ユーザーインタビュー（定性）を統合し、
課題発見 → 仕様 → 実装 → 実験まで自動化するPMツール。

---

## 動画構成（90秒）

### 1. Hook（0–8秒）

PMのデスクトップ: Slack / Notion / Linear / Amplitude / Figma ＋カレンダーMTGだらけ

> 「プロダクトで一番難しいのはコードではない。何を作るかだ。」

### 2. Problem（8–25秒）

PMがバラバラの情報を見る
- ユーザーインタビュー
- プロダクト分析
- Feature request
- Backlog

**問題:** データはあるが意思決定につながらない

### 3. Solution（25–35秒）

プロダクト紹介: **Iterate** — AI-native Product Discovery System

---

## デモ（核心）

### Step 1: データ分析

AIがプロダクトデータを分析

| 指標 | 値 |
|------|-----|
| Tab A CTR | 41% |
| Tab B CTR | 0.8% |

→ 使われない機能を発見

### Step 2: PMインタビュー（失敗）

- PM質問: 「この機能魅力ありますか？」
- ユーザー: 「うーん…」
- → 原因わからない

### Step 3: AIインタビュー

- AI質問: 「このタブの存在に気づいていましたか？」
- ユーザー: 「え？知らなかった」
- 結果: **78%が存在に気づいていない**

### Step 4: 原因分析

AI reasoning:
- Analytics → CTR 0.8%
- Interview → 78% unaware

**結論: UIの視認性問題**

### Step 5: 改善提案

AIが仕様生成:
- タブ色コントラスト改善
- 通知ドット
- タブ位置調整

スコアリング指標: Impact / Confidence / Engineering Effort（RICE風）

### Step 6: 実装

AI → コード生成 → PR作成 → A/Bテスト

**結果: Engagement +14%**

---

## Ending

> AI shouldn't just write code.
> It should decide what to build.

---

## 演出ポイント

### ① Linear風UI

審査員が好きなデザイン系: Linear / Vercel / Cursor

### ② AI reasoning可視化

Evidence表示例:
- Interview #12
- Analytics CTR
- Support tickets

### ③ Impactスコア

RICE風UI: Impact / Confidence / Effort

---

## ストーリー演出（探偵ドラマ）

| 役割 | 内容 |
|------|------|
| 事件 | 「押されないボタン」 |
| 容疑者 | 「機能が魅力ない」 |
| 真犯人 | 「ユーザーが存在に気づいていない」 |
| PM | 推測 |
| AI | 現場検証 |

---

## プロダクトの思想

AI Product Flywheel:

```
Users → Data → AI Insight → Tasks → Code → Experiment → Users
```

Closed AI loop for product management

---

## 名前決定

候補: ProdCursor / BuildSense / ProdMind / FeatureGPT

**決定: ✅ Iterate**

Repo: https://github.com/iterateapp/iterate

---

## 補足議論

- Cursor固定は避ける → Claude / Codex など対応したい
- 定量＋定性の統合を強調
- AIがインタビュー設計まで行う可能性
