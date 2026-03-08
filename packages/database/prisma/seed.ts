import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Organization
  const org = await prisma.organization.create({
    data: {
      name: "Iterate Inc.",
    },
  });

  // User
  const pm = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: "pm@iterate.app",
      name: "Takumi",
      role: "owner",
    },
  });

  // Product
  const product = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: "ECアプリ",
      description: "モバイルコマースアプリ",
    },
  });

  // Connections
  const amplitude = await prisma.connection.create({
    data: {
      organizationId: org.id,
      productId: product.id,
      provider: "amplitude",
      name: "本番 Amplitude",
      credentials: { apiKey: "amp_xxx", secretKey: "amp_secret_xxx" },
    },
  });

  const slack = await prisma.connection.create({
    data: {
      organizationId: org.id,
      provider: "slack",
      name: "Iterate Workspace",
      credentials: { botToken: "xoxb-xxx" },
      config: { channel: "#product-alerts" },
    },
  });

  const linear = await prisma.connection.create({
    data: {
      organizationId: org.id,
      provider: "linear",
      name: "Iterate Linear",
      credentials: { apiKey: "lin_xxx" },
    },
  });

  const github = await prisma.connection.create({
    data: {
      organizationId: org.id,
      productId: product.id,
      provider: "github",
      name: "iterateapp/ec-app",
      credentials: { token: "ghp_xxx" },
      config: { owner: "iterateapp", repo: "ec-app" },
    },
  });

  // Thread + Messages
  const thread = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "モバイル決済の離脱率調査",
      messages: {
        create: [
          {
            role: "assistant",
            content:
              "モバイルのチェックアウト離脱率が前週比 +15% に上昇しました。調査を開始します。",
          },
          {
            userId: pm.id,
            role: "user",
            content: "影響ユーザーにインタビューしてほしい",
          },
          {
            role: "assistant",
            content:
              "影響ユーザー20人にAIインタビューを送付しました。回答が集まり次第報告します。",
          },
        ],
      },
    },
  });

  // Insight
  const insight = await prisma.insight.create({
    data: {
      productId: product.id,
      threadId: thread.id,
      sourceConnectionId: amplitude.id,
      title: "モバイルチェックアウト離脱率 +15%",
      description:
        "3/1リリースの新決済フローにより、モバイルのチェックアウト離脱率が前週比15%増加。Step 3→4での離脱が集中。",
      severity: "critical",
      status: "resolved",
      summary:
        "新決済フローのステップ数増加（3→5）が主因。Step 3→4の離脱が全体の62%を占める。",
      findings: {
        funnelDrop: { step3to4: 0.62, step4to5: 0.23 },
        affectedUsers: 1847,
        revenueImpact: 45000,
        rootCause: "checkout_step_increase",
      },
      confidence: 0.87,
    },
  });

  // Interview + Responses
  const interview = await prisma.interview.create({
    data: {
      productId: product.id,
      insightId: insight.id,
      title: "チェックアウト体験に関するインタビュー",
      questions: [
        "最近のチェックアウト体験で困ったことはありますか？",
        "決済完了までのステップ数についてどう感じますか？",
        "途中で購入をやめたことはありますか？その理由を教えてください。",
      ],
      targetCount: 20,
      status: "completed",
      responses: {
        create: [
          {
            respondentId: "user_001",
            answers: [
              "前は1画面で終わったのに、何回も確認画面が出てくる",
              "多すぎる。3回くらいでやめたくなる",
              "はい。住所を2回入力させられて面倒になった",
            ],
            sentiment: "negative",
            themes: ["ステップ数が多い", "重複入力"],
            completedAt: new Date(),
          },
          {
            respondentId: "user_002",
            answers: [
              "エラーが出て最初からやり直しになった",
              "長い。前の方がよかった",
              "エラーで戻されてやめた",
            ],
            sentiment: "negative",
            themes: ["ステップ数が多い", "エラー後のリカバリー不可"],
            completedAt: new Date(),
          },
          {
            respondentId: "user_003",
            answers: [
              "特に問題なかった",
              "少し多いかも",
              "いいえ",
            ],
            sentiment: "neutral",
            themes: ["ステップ数が多い"],
            completedAt: new Date(),
          },
        ],
      },
    },
  });

  // Recommendation
  const recommendation = await prisma.recommendation.create({
    data: {
      insightId: insight.id,
      title: "チェックアウトフローを5ステップから2ステップに短縮",
      description:
        "住所入力と確認画面を統合し、決済フローを簡略化する。エラー時の入力内容保持も実装。",
      priority: "critical",
      impact: 45000,
      confidence: 0.87,
      effort: "m",
      evidence: {
        quantitative: {
          source: "Amplitude",
          metric: "checkout_drop_rate",
          value: "+15%",
          affectedUsers: 1847,
        },
        qualitative: {
          interviewCount: 12,
          topThemes: [
            { theme: "ステップ数が多い", count: 9, percentage: 75 },
            { theme: "重複入力", count: 5, percentage: 42 },
            { theme: "エラー後のリカバリー不可", count: 3, percentage: 25 },
          ],
        },
      },
      status: "approved",
    },
  });

  // PRD
  await prisma.prd.create({
    data: {
      recommendationId: recommendation.id,
      title: "PRD: チェックアウトフロー簡略化",
      content: `## 背景

3/1リリースの新決済フローにより離脱率が15%増加。影響ユーザー1,847人、推定月間売上損失$45,000。

## 要件

1. 住所入力と確認画面を統合（5ステップ → 2ステップ）
2. エラー時の入力内容保持
3. 住所の重複入力を排除（配送先 = 請求先のデフォルトチェック）

## 成功指標

- チェックアウト離脱率を元の水準に回復（-15%）
- チェックアウト完了時間を40%短縮`,
      version: 1,
      status: "approved",
    },
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      {
        productId: product.id,
        recommendationId: recommendation.id,
        title: "住所入力フォームと確認画面の統合",
        description: "5ステップの決済フローを2ステップに短縮する",
        status: "in_progress",
        assigneeId: pm.id,
        externalId: "LIN-142",
        externalUrl: "https://linear.app/iterate/issue/LIN-142",
      },
      {
        productId: product.id,
        recommendationId: recommendation.id,
        title: "エラー時の入力内容保持の実装",
        description: "フォームエラー発生時にユーザーの入力内容が消えないようにする",
        status: "todo",
        externalId: "LIN-143",
        externalUrl: "https://linear.app/iterate/issue/LIN-143",
      },
      {
        productId: product.id,
        recommendationId: recommendation.id,
        title: "配送先=請求先のデフォルトチェックボックス追加",
        description: "住所の重複入力を排除",
        status: "backlog",
        externalId: "LIN-144",
        externalUrl: "https://linear.app/iterate/issue/LIN-144",
      },
    ],
  });

  // Experiment
  await prisma.experiment.create({
    data: {
      productId: product.id,
      connectionId: amplitude.id,
      externalId: "exp_checkout_v2",
      name: "チェックアウトフロー v2 A/Bテスト",
      hypothesis:
        "ステップ数を5→2に短縮することで、チェックアウト完了率が15%以上改善する",
      status: "running",
    },
  });

  console.log("Seed completed successfully");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
