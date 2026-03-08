import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Organization
  const org = await prisma.organization.create({
    data: { name: "Acme Corp" },
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
      name: "Creator Platform",
      description: "Creator economy platform for content creators and fans",
    },
  });

  // ─── Connections ───
  const amplitude = await prisma.connection.create({
    data: {
      organizationId: org.id,
      productId: product.id,
      provider: "amplitude",
      name: "Amplitude",
      credentials: { apiKey: "amp_xxx", secretKey: "amp_secret_xxx" },
      lastSyncAt: new Date(Date.now() - 2 * 60 * 1000),
      syncData: {
        eventsIngested: "12,438",
        errorRate: "0.02%",
        metrics: [
          { name: "DAU", value: "12,847", change: "+8.2%", trend: "up" },
          { name: "7-day Retention", value: "34.2%", change: "+2.1pp", trend: "up" },
          { name: "Conversion Rate", value: "4.8%", change: "-0.3pp", trend: "down" },
          { name: "Avg Session", value: "4m 32s", change: "+12s", trend: "up" },
        ],
        topEvents: [
          { name: "page_view", count: 45230, change: "+12%" },
          { name: "button_click", count: 12847, change: "+5%" },
          { name: "search_performed", count: 8234, change: "-3%" },
          { name: "creator_profile_viewed", count: 6891, change: "+18%" },
          { name: "content_shared", count: 3456, change: "+7%" },
          { name: "signup_completed", count: 1203, change: "+2%" },
        ],
        funnelData: [
          { step: "Landing Page", users: 28400, rate: 100 },
          { step: "Sign Up", users: 14200, rate: 50 },
          { step: "Onboarding Complete", users: 9940, rate: 35 },
          { step: "First Action", users: 5680, rate: 20 },
          { step: "Day 7 Return", users: 2840, rate: 10 },
        ],
        nps: { score: 42, previousScore: 38, promoters: 48, passives: 32, detractors: 20 },
      },
    },
  });

  await prisma.connection.create({
    data: {
      organizationId: org.id,
      provider: "mixpanel",
      name: "Mixpanel",
      credentials: {},
      lastSyncAt: null,
    },
  });

  await prisma.connection.create({
    data: {
      organizationId: org.id,
      productId: product.id,
      provider: "sentry",
      name: "Sentry",
      credentials: { dsn: "https://xxx@sentry.io/123" },
      lastSyncAt: new Date(Date.now() - 5 * 60 * 1000),
      syncData: {
        eventsIngested: "3,291",
        errorRate: "0.01%",
      },
    },
  });

  const slack = await prisma.connection.create({
    data: {
      organizationId: org.id,
      provider: "slack",
      name: "Slack",
      credentials: { botToken: "xoxb-xxx" },
      config: { channel: "#product-alerts" },
      lastSyncAt: new Date(Date.now() - 8 * 60 * 1000),
      syncData: {
        eventsIngested: "1,847",
        errorRate: "0%",
        supportThemes: [
          { theme: "Can't discover new creators", tickets: 23, trend: "up" },
          { theme: "Notification overload", tickets: 18, trend: "up" },
          { theme: "Search not returning results", tickets: 15, trend: "stable" },
          { theme: "Onboarding confusion", tickets: 12, trend: "down" },
          { theme: "Sharing flow broken on mobile", tickets: 8, trend: "stable" },
        ],
      },
    },
  });

  await prisma.connection.create({
    data: {
      organizationId: org.id,
      productId: product.id,
      provider: "crustdata",
      name: "Crustdata",
      credentials: { apiKey: "crust_xxx" },
      lastSyncAt: new Date(Date.now() - 12 * 60 * 1000),
      syncData: {
        eventsIngested: "8,214",
        errorRate: "0.03%",
      },
    },
  });

  const linear = await prisma.connection.create({
    data: {
      organizationId: org.id,
      provider: "linear",
      name: "Iterate Linear",
      credentials: { apiKey: "lin_xxx" },
      lastSyncAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  const github = await prisma.connection.create({
    data: {
      organizationId: org.id,
      productId: product.id,
      provider: "github",
      name: "acme-corp/creator-platform",
      credentials: { token: "ghp_xxx" },
      config: { owner: "acme-corp", repo: "creator-platform" },
      lastSyncAt: new Date(Date.now() - 60 * 60 * 1000),
      syncData: {
        repoInfo: {
          owner: "acme-corp",
          name: "creator-platform",
          fullName: "acme-corp/creator-platform",
          defaultBranch: "main",
          url: "https://github.com/acme-corp/creator-platform",
          openPrs: 2,
          branches: 8,
          lastPush: "6h ago",
        },
        pullRequests: [
          { id: "pr_001", number: 149, title: "feat: implement interest-based onboarding flow", branch: "feat/onboarding-personalization", baseBranch: "main", featureName: "Onboarding Personalization", status: "merged", additions: 487, deletions: 123, filesChanged: 14, createdAt: "3d ago", reviewStatus: "approved", author: "iterate-ai", authorAvatar: "IA" },
          { id: "pr_002", number: 147, title: "feat: add batch queue service for notifications", branch: "feat/notification-batch-queue", baseBranch: "main", featureName: "Smart Notification Batching", status: "merged", additions: 312, deletions: 28, filesChanged: 9, createdAt: "2d ago", reviewStatus: "approved", author: "iterate-ai", authorAvatar: "IA" },
          { id: "pr_003", number: 145, title: "feat: notification preferences UI", branch: "feat/notification-preferences-ui", baseBranch: "main", featureName: "Smart Notification Batching", status: "open", additions: 234, deletions: 45, filesChanged: 8, createdAt: "1d ago", reviewStatus: "pending", author: "iterate-ai", authorAvatar: "IA" },
          { id: "pr_004", number: 142, title: "feat: notification grouping algorithm", branch: "feat/notification-grouping", baseBranch: "main", featureName: "Smart Notification Batching", status: "merged", additions: 189, deletions: 12, filesChanged: 5, createdAt: "4d ago", reviewStatus: "approved", author: "iterate-ai", authorAvatar: "IA" },
          { id: "pr_005", number: 151, title: "feat: optimal notification timing engine", branch: "feat/notification-timing-engine", baseBranch: "main", featureName: "Smart Notification Batching", status: "draft", additions: 156, deletions: 8, filesChanged: 4, createdAt: "6h ago", reviewStatus: "none", author: "iterate-ai", authorAvatar: "IA" },
        ],
      },
    },
  });

  // ─── Threads (Chat) ───
  const thread1 = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "Creator discovery deep dive",
      messages: {
        create: [
          {
            role: "assistant",
            content:
              "Good morning! Here's your daily product briefing:\n\n**Key highlights:**\n- DAU up 8.2% to 12,847\n- Mobile checkout abandonment insight has been approved — 6 tasks created in Linear\n- Creator discovery drop-off (68%) detected 3 days ago, recommendation ready for review\n\nWhat would you like to focus on today?",
          },
          {
            userId: pm.id,
            role: "user",
            content: "Tell me more about the creator discovery issue",
          },
          {
            role: "assistant",
            content:
              "**Creator Discovery Page — 68% Drop-off**\n\nUsers spend only 14 seconds on discovery before leaving (vs 3.2 min on curated feeds). The core issue is zero personalization — the algorithm shows globally trending creators regardless of user preferences.\n\n**Evidence:**\n- 12/15 interview respondents confirmed\n- 23 support tickets about discovery quality\n- Users who discover a creator have 4.1x higher 30-day retention\n\n**Recommendation ready:** AI-powered creator discovery feed with interest-based matching. Estimated impact: +40% discovery engagement.\n\nWould you like to approve this recommendation?",
          },
          {
            userId: pm.id,
            role: "user",
            content: "What's the effort estimate?",
          },
          {
            role: "assistant",
            content:
              "Effort estimate: **Large (L)**\n\nBreakdown:\n- Recommendation engine backend: ~2 weeks\n- Interest profiling pipeline: ~1 week\n- New discovery UI: ~1 week\n- A/B test setup: ~2 days\n\nTotal: approximately 4-5 weeks with 2 engineers. The mobile checkout fix (Medium effort) is already in progress and won't conflict.\n\nShall I generate a PRD and create tasks?",
          },
        ],
      },
    },
  });

  const thread2 = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "Notification batching strategy",
      messages: {
        create: [
          {
            userId: pm.id,
            role: "user",
            content: "What's the plan for notification batching?",
          },
          {
            role: "assistant",
            content:
              "Current notification system sends **47 notifications/day** per user — 8x the recommended amount. The plan:\n\n1. **Priority tiers:** Creator updates (high), follows (medium), likes/comments (low)\n2. **Smart batching:** Low-priority items grouped into 2 daily digests\n3. **Optimal timing:** Deliver based on user's historical engagement patterns\n\nPR #145 (preferences UI) is open, PR #151 (timing engine) is in draft.",
          },
        ],
      },
    },
  });

  const thread3 = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "Mobile checkout fix status",
      messages: {
        create: [
          {
            userId: pm.id,
            role: "user",
            content: "Status on the mobile checkout fix?",
          },
          {
            role: "assistant",
            content:
              "**Mobile checkout — Approved & In Development**\n\nPRD generated, **6 tasks** in Linear:\n1. Apple Pay / Google Pay integration\n2. 2-step checkout flow design\n3. Cart review component\n4. Payment fallback logic\n5. Checkout flow tests\n6. A/B experiment setup\n\nBranch: `feat/mobile-checkout-v2`\nEstimated recovery: **~$45K/month** in abandoned carts.",
          },
        ],
      },
    },
  });

  const thread4 = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "Onboarding categories review",
      messages: {
        create: [
          {
            userId: pm.id,
            role: "user",
            content: "How should we redesign the onboarding categories?",
          },
          {
            role: "assistant",
            content:
              "Current categories (**Art, Music, Tech, Lifestyle, Gaming, Education**) are too broad — users spend only 8 seconds before abandoning.\n\n**Recommendation:** Expand to 24 subcategories with visual previews. Let users select 3+ interests. Show creator samples for each category.\n\nThe personalized onboarding experiment already shows **+50% completion** (98% significance). Building on that success.",
          },
        ],
      },
    },
  });

  // ─── Insight threads (for the insight chat messages) ───
  const insightThread1 = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "Mobile checkout abandonment investigation",
      messages: {
        create: [
          {
            role: "assistant",
            content:
              "**Anomaly detected:** Mobile cart abandonment increased 15% over 2 weeks. Current rate: 78% (vs 34% desktop). Starting investigation.",
          },
          {
            role: "assistant",
            content:
              'Investigation complete. Spike correlates with payment SDK v3.2 upgrade on Mar 1. **Step 3→4 transition** has 78% drop-off on mobile.\n\n**Root cause:** New SDK re-renders payment form on field focus change, causing input loss on mobile keyboards.\n\nSending interview requests to 20 affected users.',
          },
          {
            userId: pm.id,
            role: "user",
            content: "How many users are affected weekly?",
          },
          {
            role: "assistant",
            content:
              "From Amplitude data:\n\n- **~2,400 users/week** reach mobile checkout\n- **~1,870** abandon at Step 3→4\n- Average cart value: **$24**\n- Estimated weekly revenue loss: **$11.2K**",
          },
          {
            role: "assistant",
            content:
              '**14 of 20 interviews completed.** Key themes:\n\n> "The payment page reloads every time I switch fields"\n> "I gave up after entering my card twice"\n\n**92% confidence** — quantitative and qualitative data integrated.',
          },
          {
            userId: pm.id,
            role: "user",
            content: "Approved. Generate the PRD and create tasks.",
          },
          {
            role: "assistant",
            content:
              "PRD generated and **6 tasks** created in Linear:\n\n1. Implement Apple Pay / Google Pay integration\n2. Design 2-step checkout flow\n3. Build cart review component\n4. Add payment method fallback logic\n5. Write checkout flow tests\n6. Set up A/B experiment\n\nGitHub branch: `feat/mobile-checkout-v2`",
          },
        ],
      },
    },
  });

  const insightThread2 = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "Creator discovery drop-off investigation",
      messages: {
        create: [
          {
            role: "assistant",
            content:
              "**Anomaly detected:** Discovery page drop-off is 68%. Users spend only 14s before leaving — 13.7x lower than curated feeds.",
          },
          {
            role: "assistant",
            content:
              "Investigation complete. Core issue: **zero personalization** in discovery algorithm. Shows globally trending creators regardless of user preferences.\n\n- 14s avg session vs 3.2min on curated feeds\n- 23 support tickets about discovery quality\n- Users who discover a creator have **4.1x higher** 30-day retention\n\nSending 15 interview requests.",
          },
          {
            userId: pm.id,
            role: "user",
            content: "What are users saying?",
          },
          {
            role: "assistant",
            content:
              '12 of 15 responded. Consistent feedback:\n\n> "I scroll for 10 minutes and can\'t find anyone I like"\n> "The recommendations feel completely random"\n> "I only find creators through friends, never through the app"\n\nPattern: users want **interest-based** recommendations, not popularity-based. Confidence: **86%**.',
          },
          {
            role: "assistant",
            content:
              "Quantitative + qualitative integrated. Generating recommendation.",
          },
        ],
      },
    },
  });

  const insightThread3 = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "Notification opt-out investigation",
      messages: {
        create: [
          {
            role: "assistant",
            content:
              "**Anomaly detected:** Push notification opt-out rate is 42% within 7 days — 3x industry average (~14%). Investigating.",
          },
          {
            role: "assistant",
            content:
              "Findings:\n\n- Users receive **47 notifications/day** (8x recommended)\n- **No preference controls** — all or nothing\n- Opt-out users have **2.8x lower** 30-day retention\n\nSending 10 interview requests to recent opt-out users.",
          },
          {
            role: "assistant",
            content:
              '7 of 10 interviews completed:\n\n> "I got 47 notifications in one day. I just turned them all off."\n> "I want creator updates, but not likes and comments."\n\n**Insight resolved** — quant + qual integrated. Confidence: **79%**. Ready for recommendation.',
          },
          {
            userId: pm.id,
            role: "user",
            content:
              "What notification types get the most engagement?",
          },
          {
            role: "assistant",
            content:
              "From Amplitude:\n\n- **New content from followed creators:** 34% open rate\n- **Someone followed you:** 22% open rate\n- **Likes on your content:** 4% open rate\n- **Comments on others' content:** 2% open rate\n\nBottom two categories = **72% of all notifications** but only **3% of engagement**. Strong case for priority-based batching. Generating recommendation next.",
          },
        ],
      },
    },
  });

  const insightThread4 = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "Onboarding abandonment investigation",
      messages: {
        create: [
          {
            role: "assistant",
            content:
              "**Anomaly detected:** Onboarding completion is 34%. Step 3 (interest selection) has 52% abandonment. Completers have **4.2x higher** 30-day retention.",
          },
          {
            role: "assistant",
            content:
              "Investigating. Initial findings:\n\n- Users spend **8 seconds** on Step 3 before leaving\n- Only 6 broad interest categories\n- Users selecting 3+ interests have **67% higher** engagement\n\nSent 12 interviews — 4 returned so far. Confidence: **64%**.",
          },
          {
            userId: pm.id,
            role: "user",
            content: "What are the current 6 categories?",
          },
          {
            role: "assistant",
            content:
              '**Art, Music, Tech, Lifestyle, Gaming, Education** — very broad. Successful platforms use 20-40 specific subcategories. Waiting for more interview responses to raise confidence.',
          },
        ],
      },
    },
  });

  const insightThread5 = await prisma.thread.create({
    data: {
      productId: product.id,
      title: "API latency spike investigation",
      messages: {
        create: [
          {
            role: "assistant",
            content:
              '**Anomaly detected:** API P95 latency increased from 120ms to 890ms during peak hours (2-6pm UTC). Feed endpoint accounts for 68% of peak load. 12% of requests timing out.\n\nStarting automated investigation — analyzing endpoint patterns, database queries, and cache hit rates.',
          },
        ],
      },
    },
  });

  // ─── Insights ───
  const insight1 = await prisma.insight.create({
    data: {
      productId: product.id,
      threadId: insightThread1.id,
      sourceConnectionId: amplitude.id,
      title: "Mobile checkout abandonment rate +15%",
      description:
        "Mobile cart abandonment increased 15% over 2 weeks. Current rate: 78% (vs 34% desktop). Spike correlates with payment SDK v3.2 upgrade.",
      severity: "critical",
      status: "resolved",
      metric: "Cart Abandonment",
      topics: [],
      summary:
        "New SDK re-renders payment form on field focus change, causing input loss on mobile keyboards. Step 3→4 transition has 78% drop-off.",
      findings: {
        funnelDrop: { step3to4: 0.62, step4to5: 0.23 },
        affectedUsers: 1847,
        revenueImpact: 45000,
        rootCause: "checkout_step_increase",
      },
      confidence: 0.92,
      detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const insight2 = await prisma.insight.create({
    data: {
      productId: product.id,
      threadId: insightThread2.id,
      sourceConnectionId: amplitude.id,
      title: "Creator discovery page 68% drop-off",
      description:
        "Discovery page drop-off is 68%. Users spend only 14s before leaving — 13.7x lower than curated feeds. Zero personalization in discovery algorithm.",
      severity: "high",
      status: "resolved",
      metric: "Discovery Engagement",
      topics: ["Discovery"],
      confidence: 0.86,
      detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const insight3 = await prisma.insight.create({
    data: {
      productId: product.id,
      threadId: insightThread3.id,
      sourceConnectionId: amplitude.id,
      title: "Notification opt-out rate 3x industry average",
      description:
        "Push notification opt-out rate is 42% within 7 days — 3x industry average (~14%). Users receive 47 notifications/day.",
      severity: "high",
      status: "resolved",
      metric: "Notification Opt-in",
      topics: ["Notifications"],
      confidence: 0.79,
      detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const insight4 = await prisma.insight.create({
    data: {
      productId: product.id,
      threadId: insightThread4.id,
      sourceConnectionId: amplitude.id,
      title: "Onboarding Step 3 has 52% abandonment",
      description:
        "Onboarding completion is 34%. Step 3 (interest selection) has 52% abandonment. Completers have 4.2x higher 30-day retention.",
      severity: "medium",
      status: "investigating",
      metric: "Onboarding Completion",
      topics: ["Onboarding"],
      confidence: 0.64,
      detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const insight5 = await prisma.insight.create({
    data: {
      productId: product.id,
      threadId: insightThread5.id,
      sourceConnectionId: amplitude.id,
      title: "API P95 latency spike to 890ms at peak hours",
      description:
        "API P95 latency increased from 120ms to 890ms during peak hours (2-6pm UTC). Feed endpoint accounts for 68% of peak load. 12% of requests timing out.",
      severity: "high",
      status: "detected",
      metric: "API Response Time",
      topics: [],
      confidence: 0.42,
      detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  // ─── Interviews ───
  const interview1 = await prisma.interview.create({
    data: {
      productId: product.id,
      insightId: insight1.id,
      title: "Mobile checkout experience",
      questions: [
        "How was your mobile checkout experience recently?",
        "Did you encounter any issues during payment?",
      ],
      targetCount: 20,
      status: "completed",
      responses: {
        create: [
          {
            respondentId: "User #3891",
            answers: [
              "The payment page reloads every time I switch fields. I gave up after entering my card number twice.",
            ],
            sentiment: "negative",
            themes: ["Checkout", "Payment form reload"],
            completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
          {
            respondentId: "User #4102",
            answers: [
              "I tried Apple Pay but the button didn't work. Ended up using desktop instead.",
            ],
            sentiment: "negative",
            themes: ["Checkout", "Apple Pay"],
            completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  const interview2 = await prisma.interview.create({
    data: {
      productId: product.id,
      insightId: insight2.id,
      title: "Creator discovery experience",
      questions: [
        "How do you currently discover new creators?",
        "What frustrates you about the discovery experience?",
      ],
      targetCount: 15,
      status: "completed",
      responses: {
        create: [
          {
            respondentId: "User #2847",
            answers: [
              "I spend 10 minutes scrolling but can never find creators I actually like. The recommendations feel completely random.",
            ],
            sentiment: "negative",
            themes: ["Discovery", "Personalization"],
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            respondentId: "User #4521",
            answers: [
              "Search works fine if I know the exact name, but I can't explore by topic or style at all.",
            ],
            sentiment: "neutral",
            themes: ["Search", "Discovery"],
            completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  const interview3 = await prisma.interview.create({
    data: {
      productId: product.id,
      insightId: insight3.id,
      title: "Notification preferences",
      questions: [
        "Why did you turn off notifications?",
        "What types of notifications would you want to keep?",
      ],
      targetCount: 10,
      status: "completed",
      responses: {
        create: [
          {
            respondentId: "User #1923",
            answers: [
              "I got 47 notifications in one day. I just turned them all off. Now I miss important updates from creators I follow.",
            ],
            sentiment: "negative",
            themes: ["Notifications", "Overload"],
            completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  const interview4 = await prisma.interview.create({
    data: {
      productId: product.id,
      insightId: insight4.id,
      title: "Onboarding experience",
      questions: [
        "What was your experience during onboarding?",
        "Did the interest categories feel relevant to you?",
      ],
      targetCount: 12,
      status: "active",
      responses: {
        create: [
          {
            respondentId: "User #3102",
            answers: [
              "After signing up I had no idea what to do. The onboarding asked me about categories I've never heard of.",
            ],
            sentiment: "negative",
            themes: ["Onboarding", "Categories"],
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            respondentId: "User #1087",
            answers: [
              "I love the personalized feed since the last update! It's exactly what I want to see every time I open the app.",
            ],
            sentiment: "positive",
            themes: ["Feed", "Personalization"],
            completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // ─── Recommendations ───
  const rec1 = await prisma.recommendation.create({
    data: {
      insightId: insight1.id,
      title: "Simplify to 2-step mobile checkout",
      description:
        "Replace 5-step payment flow with: (1) Review cart, (2) One-tap payment via Apple Pay / Google Pay. Fall back to saved cards, then manual entry.",
      priority: "critical",
      impact: 45000,
      confidence: 0.92,
      effort: "m",
      evidence: {
        quantitative: {
          source: "Amplitude",
          metric: "checkout_drop_rate",
          value: "+15%",
          affectedUsers: 1847,
        },
        qualitative: {
          interviewCount: 14,
          topThemes: [
            { theme: "Payment form reload", count: 9, percentage: 75 },
            { theme: "Duplicate input", count: 5, percentage: 42 },
            { theme: "Error recovery", count: 3, percentage: 25 },
          ],
        },
        estimatedImpact: "Recover ~$45K/month in abandoned carts",
      },
      status: "approved",
    },
  });

  const rec2 = await prisma.recommendation.create({
    data: {
      insightId: insight2.id,
      title: "AI-powered creator discovery feed",
      description:
        'Personalized recommendations based on interests, interaction history, and content affinity. Include "Because you follow X" explanations.',
      priority: "high",
      impact: 30000,
      confidence: 0.86,
      effort: "l",
      evidence: {
        estimatedImpact: "+40% discovery engagement, +15% follow rate",
      },
      status: "proposed",
    },
  });

  const rec3 = await prisma.recommendation.create({
    data: {
      insightId: insight3.id,
      title: "Smart Notification Batching",
      description:
        "Intelligent grouping of notifications by priority and context, delivered at optimal times based on user behavior.",
      priority: "high",
      impact: 20000,
      confidence: 0.79,
      effort: "m",
      evidence: {
        estimatedImpact: "Reduce opt-out by 60%, improve retention",
      },
      status: "approved",
    },
  });

  const rec4 = await prisma.recommendation.create({
    data: {
      insightId: insight4.id,
      title: "Onboarding Personalization",
      description:
        "Dynamic onboarding flow that adapts based on user type, interests, and engagement patterns.",
      priority: "medium",
      impact: 15000,
      confidence: 0.91,
      effort: "m",
      evidence: {
        estimatedImpact: "+50% onboarding completion",
      },
      status: "approved",
    },
  });

  const rec5 = await prisma.recommendation.create({
    data: {
      insightId: insight1.id,
      title: "Semantic Search Upgrade",
      description:
        "AI-powered search that understands intent and context for long-tail queries.",
      priority: "medium",
      impact: 12000,
      confidence: 0.74,
      effort: "l",
      evidence: {
        estimatedImpact: "+42% search success rate",
      },
      status: "approved",
    },
  });

  const rec6 = await prisma.recommendation.create({
    data: {
      insightId: insight5.id,
      title: "One-tap Share Sheet",
      description:
        "Streamlined sharing flow with platform-specific previews and one-tap actions.",
      priority: "low",
      impact: 8000,
      confidence: 0.68,
      effort: "s",
      evidence: {
        estimatedImpact: "+55% share completion rate",
      },
      status: "proposed",
    },
  });

  // ─── PRDs ───
  await prisma.pRD.create({
    data: {
      recommendationId: rec1.id,
      title: "PRD: 2-Step Mobile Checkout",
      content: `## Background\n\nPayment SDK v3.2 upgrade caused 15% increase in mobile checkout abandonment. ~1,870 users/week affected, estimated $45K/month revenue loss.\n\n## Requirements\n\n1. Replace 5-step flow with 2-step checkout\n2. Apple Pay / Google Pay integration\n3. Saved card fallback\n4. Error recovery with input preservation\n\n## Success Metrics\n\n- Checkout abandonment rate back to pre-v3.2 levels\n- Checkout completion time reduced by 40%`,
      version: 1,
      status: "approved",
    },
  });

  // ─── Tasks ───
  await prisma.task.createMany({
    data: [
      {
        productId: product.id,
        recommendationId: rec1.id,
        assigneeId: pm.id,
        title: "Implement Apple Pay / Google Pay integration",
        description: "Add native payment support for one-tap checkout",
        status: "in_progress",
        externalId: "LIN-142",
        externalUrl: "https://linear.app/iterate/issue/LIN-142",
      },
      {
        productId: product.id,
        recommendationId: rec1.id,
        title: "Design 2-step checkout flow",
        description: "Create the simplified checkout UI",
        status: "done",
        externalId: "LIN-143",
        externalUrl: "https://linear.app/iterate/issue/LIN-143",
      },
      {
        productId: product.id,
        recommendationId: rec1.id,
        title: "Build cart review component",
        description: "Step 1 of the new checkout flow",
        status: "in_progress",
        externalId: "LIN-144",
        externalUrl: "https://linear.app/iterate/issue/LIN-144",
      },
      {
        productId: product.id,
        recommendationId: rec1.id,
        title: "Add payment method fallback logic",
        status: "todo",
        externalId: "LIN-145",
        externalUrl: "https://linear.app/iterate/issue/LIN-145",
      },
      {
        productId: product.id,
        recommendationId: rec1.id,
        title: "Write checkout flow tests",
        status: "backlog",
        externalId: "LIN-146",
        externalUrl: "https://linear.app/iterate/issue/LIN-146",
      },
      {
        productId: product.id,
        recommendationId: rec1.id,
        title: "Set up A/B experiment",
        status: "backlog",
        externalId: "LIN-147",
        externalUrl: "https://linear.app/iterate/issue/LIN-147",
      },
    ],
  });

  // ─── Experiments ───
  await prisma.experiment.create({
    data: {
      productId: product.id,
      connectionId: amplitude.id,
      externalId: "exp_onboarding_v2",
      name: "Personalized Onboarding v2",
      hypothesis:
        "Dynamic onboarding with subcategories will increase completion rate",
      metric: "Onboarding Completion",
      significance: 98,
      results: {
        variants: [
          { name: "Control", users: 4820, metric: 34, change: 0 },
          { name: "Personalized", users: 4795, metric: 51, change: 50 },
        ],
      },
      status: "completed",
      branch: "feat/onboarding-personalization",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.experiment.create({
    data: {
      productId: product.id,
      connectionId: amplitude.id,
      externalId: "exp_notification_batch",
      name: "Notification Batching",
      hypothesis:
        "Batching low-priority notifications will reduce opt-out rate",
      metric: "Notification Opt-in Rate",
      significance: 72,
      results: {
        variants: [
          { name: "Control", users: 2100, metric: 58, change: 0 },
          { name: "Batched", users: 2150, metric: 71, change: 22.4 },
        ],
      },
      status: "running",
      branch: "feat/notification-batch-queue",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.experiment.create({
    data: {
      productId: product.id,
      connectionId: amplitude.id,
      externalId: "exp_search_v3",
      name: "Search Relevance v3",
      hypothesis:
        "Semantic search will improve search success rate",
      metric: "Search Success Rate",
      significance: 95,
      results: {
        variants: [
          { name: "Control", users: 6200, metric: 33, change: 0 },
          { name: "Semantic", users: 6180, metric: 47, change: 42.4 },
        ],
      },
      status: "completed",
      branch: "feat/semantic-search-v3",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.experiment.create({
    data: {
      productId: product.id,
      connectionId: amplitude.id,
      externalId: "exp_creator_discovery",
      name: "Creator Recommendations",
      hypothesis:
        "AI-based creator recommendations will increase follow rate",
      metric: "Creator Follow Rate",
      significance: 61,
      results: {
        variants: [
          { name: "Control", users: 1800, metric: 8.2, change: 0 },
          { name: "AI Recommended", users: 1820, metric: 11.4, change: 39 },
        ],
      },
      status: "running",
      branch: "feat/creator-discovery-feed",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.experiment.create({
    data: {
      productId: product.id,
      connectionId: amplitude.id,
      externalId: "exp_share_sheet",
      name: "Simplified Sharing",
      hypothesis:
        "One-tap sharing will increase share completion rate",
      metric: "Share Completion Rate",
      significance: 45,
      results: {
        variants: [
          { name: "Control", users: 950, metric: 3.1, change: 0 },
          { name: "One-tap", users: 980, metric: 4.8, change: 54.8 },
        ],
      },
      status: "paused",
      branch: "feat/one-tap-share",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
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
