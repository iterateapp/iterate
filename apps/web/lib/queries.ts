import "server-only"
import { prisma } from "./db"
import { providerLogos, providerDescriptions, type UIInsightStatus, type UIInterviewStatus } from "./ui-config"
import type {
  DataSourceRow,
  Metric,
  TopEvent,
  FunnelStep,
  NpsData,
  SupportTheme,
  AnalyticsData,
  PrStatus,
  PullRequest,
  RepoInfo,
  GitHubData,
  ActivityItem,
  LoopStep,
  InsightMessage,
  LifecycleInsight,
  InterviewResponseRow,
  UserInterviewRow,
  FeatureStatus,
  FeatureRow,
  ExperimentStatus,
  ExperimentVariant,
  ExperimentRow,
  ThreadMessage,
  ThreadRow,
} from "./types"

// Re-export all types so server components can still import from queries
export type {
  DataSourceRow,
  Metric,
  TopEvent,
  FunnelStep,
  NpsData,
  SupportTheme,
  AnalyticsData,
  PrStatus,
  PullRequest,
  RepoInfo,
  GitHubData,
  ActivityItem,
  LoopStep,
  InsightMessage,
  LifecycleInsight,
  InterviewResponseRow,
  UserInterviewRow,
  FeatureStatus,
  FeatureRow,
  ExperimentStatus,
  ExperimentVariant,
  ExperimentRow,
  ThreadMessage,
  ThreadRow,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(date: Date | null): string {
  if (!date) return "—"
  const ms = Date.now() - date.getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min} min ago`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Connections (Data Sources)
// ---------------------------------------------------------------------------

export async function getDataSources(): Promise<DataSourceRow[]> {
  const connections = await prisma.connection.findMany({
    orderBy: { createdAt: "asc" },
  })

  return connections
    .filter((c) => ["amplitude", "mixpanel", "sentry", "slack", "crustdata"].includes(c.provider))
    .map((c) => {
      const sync = c.syncData as Record<string, unknown> | null
      return {
        id: c.id,
        name: c.name,
        provider: c.provider,
        logoSrc: providerLogos[c.provider] ?? "/logos/default.svg",
        status: (c.lastSyncAt ? "connected" : "disconnected") as DataSourceRow["status"],
        description: providerDescriptions[c.provider] ?? c.provider,
        lastSync: formatTimeAgo(c.lastSyncAt),
        eventsIngested: (sync?.eventsIngested as string) ?? "—",
        errorRate: (sync?.errorRate as string) ?? "—",
      }
    })
}

// ---------------------------------------------------------------------------
// Analytics data (from Amplitude syncData)
// ---------------------------------------------------------------------------

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const connections = await prisma.connection.findMany({
    where: { provider: { in: ["amplitude", "slack"] } },
  })

  const amplitudeConn = connections.find((c) => c.provider === "amplitude")
  const slackConn = connections.find((c) => c.provider === "slack")

  const ampSync = amplitudeConn?.syncData as Record<string, unknown> | null
  const slackSync = slackConn?.syncData as Record<string, unknown> | null

  return {
    metrics: (ampSync?.metrics as Metric[]) ?? [],
    topEvents: (ampSync?.topEvents as TopEvent[]) ?? [],
    funnelData: (ampSync?.funnelData as FunnelStep[]) ?? [],
    nps: (ampSync?.nps as NpsData) ?? null,
    supportThemes: (slackSync?.supportThemes as SupportTheme[]) ?? [],
  }
}

// ---------------------------------------------------------------------------
// GitHub data (from GitHub connection syncData)
// ---------------------------------------------------------------------------

export async function getGitHubData(): Promise<GitHubData> {
  const githubConn = await prisma.connection.findFirst({
    where: { provider: "github" },
  })

  const sync = githubConn?.syncData as Record<string, unknown> | null

  return {
    repoInfo: (sync?.repoInfo as RepoInfo) ?? null,
    pullRequests: (sync?.pullRequests as PullRequest[]) ?? [],
  }
}

// ---------------------------------------------------------------------------
// Activity feed (computed from recent DB records)
// ---------------------------------------------------------------------------

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const [insights, experiments, interviews] = await Promise.all([
    prisma.insight.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.experiment.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.interview.findMany({ orderBy: { createdAt: "desc" }, take: 2 }),
  ])

  const items: ActivityItem[] = []

  for (const ins of insights) {
    items.push({
      type: "insight",
      message: `AI generated new insight: ${ins.title}`,
      time: formatTimeAgo(ins.createdAt),
    })
  }

  for (const iv of interviews) {
    items.push({
      type: "suggestion",
      message: `AI suggests: Interview ${iv.targetCount} users — ${iv.title}`,
      time: formatTimeAgo(iv.createdAt),
    })
  }

  for (const exp of experiments) {
    if (exp.status === "completed") {
      const results = exp.results as { variants?: { name: string; change: number }[] } | null
      const winner = results?.variants?.reduce((a, b) => (a.change > b.change ? a : b))
      items.push({
        type: "result",
        message: `${exp.name}: +${winner?.change ?? 0}% ${exp.metric ?? ""} (${exp.significance ?? 0}% significance)`,
        time: formatTimeAgo(exp.createdAt),
      })
    } else if (exp.status === "running") {
      items.push({
        type: "experiment",
        message: `Experiment started: ${exp.name}`,
        time: formatTimeAgo(exp.createdAt),
      })
    }
  }

  return items.slice(0, 6)
}

// ---------------------------------------------------------------------------
// Iteration steps (computed from DB state)
// ---------------------------------------------------------------------------

export async function getIterationSteps(): Promise<LoopStep[]> {
  const [
    connectionCount,
    interviewCount,
    insightCount,
    recCount,
    featureInProgress,
    experimentCount,
    significantCount,
  ] = await Promise.all([
    prisma.connection.count({ where: { lastSyncAt: { not: null } } }),
    prisma.interview.count(),
    prisma.insight.count(),
    prisma.recommendation.count(),
    prisma.recommendation.count({ where: { status: "approved", tasks: { some: { status: "in_progress" } } } }),
    prisma.experiment.count(),
    prisma.experiment.count({ where: { significance: { gte: 95 } } }),
  ])

  const hasData = connectionCount > 0
  const hasInsights = insightCount > 0
  const hasDev = featureInProgress > 0
  const hasResults = experimentCount > 0

  type StepStatus = "complete" | "active" | "pending"
  let dataStatus: StepStatus = "pending"
  let analysisStatus: StepStatus = "pending"
  let devStatus: StepStatus = "pending"
  let resultsStatus: StepStatus = "pending"

  if (hasResults) {
    dataStatus = "complete"
    analysisStatus = "complete"
    devStatus = "complete"
    resultsStatus = "active"
  } else if (hasDev) {
    dataStatus = "complete"
    analysisStatus = "complete"
    devStatus = "active"
    resultsStatus = "pending"
  } else if (hasInsights) {
    dataStatus = "complete"
    analysisStatus = "active"
    devStatus = "pending"
    resultsStatus = "pending"
  } else if (hasData) {
    dataStatus = "active"
  }

  return [
    {
      label: "Data",
      sublabel: "Quantitative / Qualitative",
      description: "Product signals & user voices",
      status: dataStatus,
      detail: `${connectionCount} sources · ${interviewCount} interviews`,
      href: "/data",
    },
    {
      label: "Analysis",
      sublabel: "AI Insights",
      description: "Insights & next-step suggestions",
      status: analysisStatus,
      detail: `${insightCount} insights · ${recCount} suggested actions`,
      href: "/analysis",
    },
    {
      label: "Development",
      sublabel: "Features & PRs",
      description: "Features & pull requests",
      status: devStatus,
      detail: `${recCount} features · ${featureInProgress} in progress`,
      href: "/development",
    },
    {
      label: "Results",
      sublabel: "Measurement",
      description: "A/B tests & impact measurement",
      status: resultsStatus,
      detail: `${experimentCount} experiments · ${significantCount} significant`,
      href: "/results",
    },
  ]
}

// ---------------------------------------------------------------------------
// Insights (for Analysis page)
// ---------------------------------------------------------------------------

export async function getLifecycleInsights(): Promise<LifecycleInsight[]> {
  const insights = await prisma.insight.findMany({
    include: {
      sourceConnection: true,
      thread: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { user: true },
          },
        },
      },
      interviews: { select: { id: true } },
      recommendations: {
        include: {
          prd: { select: { id: true } },
          tasks: { select: { id: true } },
        },
      },
    },
    orderBy: { detectedAt: "desc" },
  })

  return insights.map((ins) => {
    let uiStatus: UIInsightStatus = ins.status as UIInsightStatus
    const hasRecommendation = ins.recommendations.length > 0
    const hasApproved = ins.recommendations.some((r) => r.status === "approved")
    const hasTasks = ins.recommendations.some((r) => r.tasks.length > 0)

    if (ins.status === "resolved" && hasRecommendation && hasApproved && hasTasks) {
      uiStatus = "in_development"
    } else if (ins.status === "resolved" && hasRecommendation && hasApproved) {
      uiStatus = "approved"
    } else if (ins.status === "resolved" && hasRecommendation) {
      uiStatus = "recommendation"
    }

    const messages: InsightMessage[] = (ins.thread?.messages ?? []).map((msg) => {
      const rec = ins.recommendations.find((r) => r.status !== "rejected")
      const isRecMessage = msg.role === "assistant" && msg.content.includes("confidence")
      const evidence = rec?.evidence as Record<string, unknown> | null

      return {
        id: msg.id,
        role: msg.role === "assistant" ? ("ai" as const) : ("user" as const),
        content: msg.content,
        timestamp: formatTimeAgo(msg.createdAt),
        ...(isRecMessage && rec
          ? {
              recommendation: {
                title: rec.title,
                description: rec.description,
                estimatedImpact: (evidence?.estimatedImpact as string) ?? `Impact: $${rec.impact?.toLocaleString() ?? "N/A"}`,
                effort: (rec.effort ?? "m").toUpperCase(),
              },
            }
          : {}),
      }
    })

    const totalTasks = ins.recommendations.reduce((sum, r) => sum + r.tasks.length, 0)
    const hasPrd = ins.recommendations.some((r) => r.prd !== null)

    return {
      id: ins.id,
      status: uiStatus,
      title: ins.title,
      metric: ins.metric ?? "",
      source: ins.sourceConnection?.name ?? "Unknown",
      detectedAt: formatTimeAgo(ins.detectedAt),
      topics: (ins.topics as string[]) ?? [],
      confidence: ins.confidence ? Math.round(ins.confidence * 100) : undefined,
      interviewId: ins.interviews[0]?.id,
      prdGenerated: hasPrd,
      taskCount: totalTasks > 0 ? totalTasks : undefined,
      messages,
    }
  })
}

// ---------------------------------------------------------------------------
// Interviews (for Data page)
// ---------------------------------------------------------------------------

export async function getUserInterviews(): Promise<UserInterviewRow[]> {
  const interviews = await prisma.interview.findMany({
    include: {
      responses: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return interviews.map((iv) => {
    const statusMap: Record<string, UIInterviewStatus> = {
      draft: "PENDING",
      sending: "PENDING",
      active: "IN_PROGRESS",
      completed: "COMPLETED",
    }

    const questions = (iv.questions as string[]).map((q, i) => ({
      id: `q${i + 1}`,
      text: q,
    }))

    return {
      id: iv.id,
      insightId: iv.insightId ?? "",
      status: statusMap[iv.status] ?? "PENDING",
      targetCount: iv.targetCount,
      sentCount: iv.targetCount,
      responseCount: iv.responses.length,
      questions,
      createdAt: formatTimeAgo(iv.createdAt),
      responses: iv.responses.map((resp) => {
        const answers = resp.answers as string[]
        const themes = (resp.themes as string[]) ?? []
        return {
          id: resp.id,
          interviewId: iv.id,
          respondentId: resp.respondentId ?? "Anonymous",
          quote: answers[0] ?? "",
          sentiment: (resp.sentiment ?? "neutral") as InterviewResponseRow["sentiment"],
          date: formatTimeAgo(resp.completedAt ?? resp.createdAt),
          topic: themes[0] ?? "General",
        }
      }),
    }
  })
}

// ---------------------------------------------------------------------------
// Recommendations (Features for Development page)
// ---------------------------------------------------------------------------

export async function getFeatures(): Promise<FeatureRow[]> {
  const recs = await prisma.recommendation.findMany({
    include: {
      insight: true,
      tasks: { select: { status: true } },
      prd: { select: { status: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return recs.map((rec) => {
    let status: FeatureStatus = "Proposed"
    if (rec.status === "approved") {
      const hasInProgress = rec.tasks.some((t) => t.status === "in_progress")
      const allDone = rec.tasks.length > 0 && rec.tasks.every((t) => t.status === "done")
      if (allDone) status = "Released"
      else if (hasInProgress) status = "In Progress"
      else status = "Approved"
    }

    const effortMap: Record<string, FeatureRow["effort"]> = {
      xs: "S", s: "S", m: "M", l: "L", xl: "XL",
    }

    return {
      id: rec.id,
      name: rec.title,
      description: rec.description,
      insightId: rec.insightId,
      impactScore: rec.impact ? Math.round(rec.impact / 5000) : 5,
      confidence: rec.confidence ? Math.round(rec.confidence * 100) : 50,
      effort: effortMap[rec.effort ?? "m"] ?? "M",
      status,
    }
  })
}

// ---------------------------------------------------------------------------
// Experiments (for Results page)
// ---------------------------------------------------------------------------

export async function getExperiments(): Promise<ExperimentRow[]> {
  const experiments = await prisma.experiment.findMany({
    orderBy: { createdAt: "desc" },
  })

  return experiments.map((exp) => {
    const results = exp.results as { variants?: ExperimentVariant[] } | null

    return {
      id: exp.id,
      name: exp.name,
      featureName: exp.hypothesis ?? exp.name,
      branch: exp.branch ?? "",
      status: exp.status as ExperimentStatus,
      metric: exp.metric ?? "",
      startedAt: formatTimeAgo(exp.createdAt),
      significance: exp.significance ?? 0,
      variants: results?.variants ?? [],
    }
  })
}

// ---------------------------------------------------------------------------
// Threads (for Chat panel)
// ---------------------------------------------------------------------------

export async function getThreads(): Promise<ThreadRow[]> {
  const threads = await prisma.thread.findMany({
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return threads
    .filter((t) => t.messages.some((m) => m.role === "user"))
    .map((t) => {
      const lastMessage = t.messages[t.messages.length - 1]
      return {
        id: t.id,
        title: t.title,
        updatedAt: formatTimeAgo(t.updatedAt),
        preview: lastMessage?.content.slice(0, 60) ?? "",
        messages: t.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: formatTimeAgo(m.createdAt),
        })),
      }
    })
}
