// Shared types used by both server queries and client components

import type { UIInsightStatus, UIInterviewStatus } from "./ui-config"

// Data Sources
export interface DataSourceRow {
  id: string
  name: string
  provider: string
  logoSrc: string
  status: "connected" | "disconnected"
  description: string
  lastSync: string
  eventsIngested: string
  errorRate: string
}

// Analytics
export interface Metric {
  name: string
  value: string
  change: string
  trend: "up" | "down" | "stable"
}

export interface TopEvent {
  name: string
  count: number
  change: string
}

export interface FunnelStep {
  step: string
  users: number
  rate: number
}

export interface NpsData {
  score: number
  previousScore: number
  promoters: number
  passives: number
  detractors: number
}

export interface SupportTheme {
  theme: string
  tickets: number
  trend: "up" | "down" | "stable"
}

export interface AnalyticsData {
  metrics: Metric[]
  topEvents: TopEvent[]
  funnelData: FunnelStep[]
  nps: NpsData | null
  supportThemes: SupportTheme[]
}

// GitHub
export type PrStatus = "merged" | "open" | "draft"

export interface PullRequest {
  id: string
  number: number
  title: string
  branch: string
  baseBranch: string
  featureName: string
  status: PrStatus
  additions: number
  deletions: number
  filesChanged: number
  createdAt: string
  reviewStatus: "approved" | "changes_requested" | "pending" | "none"
  author: string
  authorAvatar: string
}

export interface RepoInfo {
  owner: string
  name: string
  fullName: string
  defaultBranch: string
  url: string
  openPrs: number
  branches: number
  lastPush: string
}

export interface GitHubData {
  repoInfo: RepoInfo | null
  pullRequests: PullRequest[]
}

// Activity
export interface ActivityItem {
  type: "insight" | "suggestion" | "pr" | "experiment" | "result" | "data"
  message: string
  time: string
}

// Iteration Loop
export interface LoopStep {
  label: string
  sublabel: string
  description: string
  status: "complete" | "active" | "pending"
  detail: string
  href: string
}

// Insights
export interface InsightMessage {
  id: string
  role: "ai" | "user"
  content: string
  timestamp: string
  recommendation?: {
    title: string
    description: string
    estimatedImpact: string
    effort: string
  }
}

export interface LifecycleInsight {
  id: string
  status: UIInsightStatus
  title: string
  metric: string
  source: string
  detectedAt: string
  topics: string[]
  confidence?: number
  interviewId?: string
  prdGenerated?: boolean
  taskCount?: number
  messages: InsightMessage[]
}

// Interviews
export interface InterviewResponseRow {
  id: string
  interviewId: string
  respondentId: string
  quote: string
  sentiment: "positive" | "negative" | "mixed" | "neutral"
  date: string
  topic: string
  durationSec?: number
}

export interface UserInterviewRow {
  id: string
  insightId: string
  status: UIInterviewStatus
  targetCount: number
  sentCount: number
  responseCount: number
  questions: { id: string; text: string }[]
  createdAt: string
  responses: InterviewResponseRow[]
}

// Features (Recommendations)
export type FeatureStatus = "Proposed" | "Approved" | "In Progress" | "Released"

export interface FeatureRow {
  id: string
  name: string
  description: string
  insightId: string
  impactScore: number
  confidence: number
  effort: "S" | "M" | "L" | "XL"
  status: FeatureStatus
}

// Experiments
export type ExperimentStatus = "running" | "completed" | "paused"

export interface ExperimentVariant {
  name: string
  users: number
  metric: number
  change: number
}

export interface ExperimentRow {
  id: string
  name: string
  featureName: string
  branch: string
  status: ExperimentStatus
  metric: string
  startedAt: string
  significance: number
  variants: ExperimentVariant[]
}

// Threads
export interface ThreadMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export interface ThreadRow {
  id: string
  title: string
  updatedAt: string
  preview: string
  messages: ThreadMessage[]
}
