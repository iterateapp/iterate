// ---------------------------------------------------------------------------
// Iteration Loop (4 steps)
// ---------------------------------------------------------------------------
export type LoopStepStatus = "complete" | "active" | "pending"

export interface LoopStep {
  label: string
  sublabel: string
  description: string
  status: LoopStepStatus
  detail: string
  href: string
}

export const iterationSteps: LoopStep[] = [
  { label: "Data", sublabel: "Quantitative / Qualitative", description: "Product signals & user voices", status: "complete", detail: "12.4k events · 5 interviews · NPS 42", href: "/data" },
  { label: "Analysis", sublabel: "AI Insights", description: "Insights & next-step suggestions", status: "active", detail: "8 insights · 5 suggested actions", href: "/analysis" },
  { label: "Development", sublabel: "Features & PRs", description: "Features & pull requests", status: "pending", detail: "5 features · 5 PRs generated", href: "/development" },
  { label: "Results", sublabel: "Measurement", description: "A/B tests & impact measurement", status: "pending", detail: "5 experiments · 2 significant", href: "/results" },
]

// ---------------------------------------------------------------------------
// Step 1 — Data: Connected Sources
// ---------------------------------------------------------------------------
export type SourceStatus = "connected" | "disconnected"

export interface DataSource {
  name: string
  logoSrc: string
  status: SourceStatus
  description: string
  lastSync: string
  eventsIngested: string
  errorRate: string
}

export const dataSources: DataSource[] = [
  { name: "Amplitude", logoSrc: "/logos/amplitude.svg", status: "connected", description: "Product analytics", lastSync: "2 min ago", eventsIngested: "12,438", errorRate: "0.02%" },
  { name: "Mixpanel", logoSrc: "/logos/mixpanel.svg", status: "disconnected", description: "Product analytics", lastSync: "—", eventsIngested: "—", errorRate: "—" },
  { name: "Sentry", logoSrc: "/logos/sentry.svg", status: "connected", description: "Error monitoring", lastSync: "5 min ago", eventsIngested: "3,291", errorRate: "0.01%" },
  { name: "Slack", logoSrc: "/logos/slack.svg", status: "connected", description: "User feedback", lastSync: "8 min ago", eventsIngested: "1,847", errorRate: "0%" },
  { name: "Crustdata", logoSrc: "/logos/crustdata.svg", status: "connected", description: "B2B data intelligence", lastSync: "12 min ago", eventsIngested: "8,214", errorRate: "0.03%" },
]

// ---------------------------------------------------------------------------
// Step 1 — Data: Quantitative
// ---------------------------------------------------------------------------
export interface Metric {
  name: string
  value: string
  change: string
  trend: "up" | "down" | "stable"
}

export const keyMetrics: Metric[] = [
  { name: "DAU", value: "12,847", change: "+8.2%", trend: "up" },
  { name: "7-day Retention", value: "34.2%", change: "+2.1pp", trend: "up" },
  { name: "Conversion Rate", value: "4.8%", change: "-0.3pp", trend: "down" },
  { name: "Avg Session", value: "4m 32s", change: "+12s", trend: "up" },
]

export interface TopEvent {
  name: string
  count: number
  change: string
}

export const topEvents: TopEvent[] = [
  { name: "page_view", count: 45230, change: "+12%" },
  { name: "button_click", count: 12847, change: "+5%" },
  { name: "search_performed", count: 8234, change: "-3%" },
  { name: "creator_profile_viewed", count: 6891, change: "+18%" },
  { name: "content_shared", count: 3456, change: "+7%" },
  { name: "signup_completed", count: 1203, change: "+2%" },
]

export interface FunnelStep {
  step: string
  users: number
  rate: number
}

export const funnelData: FunnelStep[] = [
  { step: "Landing Page", users: 28400, rate: 100 },
  { step: "Sign Up", users: 14200, rate: 50 },
  { step: "Onboarding Complete", users: 9940, rate: 35 },
  { step: "First Action", users: 5680, rate: 20 },
  { step: "Day 7 Return", users: 2840, rate: 10 },
]

// ---------------------------------------------------------------------------
// Step 1 — Data: Qualitative — User Interviews & Responses
// ---------------------------------------------------------------------------
export type Sentiment = "positive" | "negative" | "mixed"
export type UserInterviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED"

export interface InterviewQuestion {
  id: string
  text: string
}

export interface InterviewResponse {
  id: string
  interviewId: string
  respondentId: string
  quote: string
  sentiment: Sentiment
  date: string
  topic: string
  durationSec?: number
}

export interface UserInterview {
  id: string
  insightId: string
  status: UserInterviewStatus
  targetCount: number
  sentCount: number
  responseCount: number
  questions: InterviewQuestion[]
  createdAt: string
  responses: InterviewResponse[]
}

export const userInterviewStatusConfig: Record<UserInterviewStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  EXPIRED: { label: "Expired", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

export const userInterviews: UserInterview[] = [
  {
    id: "iv_001",
    insightId: "ins_001",
    status: "COMPLETED",
    targetCount: 20,
    sentCount: 20,
    responseCount: 14,
    questions: [
      { id: "q1", text: "How was your mobile checkout experience recently?" },
      { id: "q2", text: "Did you encounter any issues during payment?" },
    ],
    createdAt: "5d ago",
    responses: [
      { id: "resp_001", interviewId: "iv_001", respondentId: "User #3891", quote: "The payment page reloads every time I switch fields. I gave up after entering my card number twice.", sentiment: "negative", date: "Mar 4", topic: "Checkout", durationSec: 180 },
      { id: "resp_002", interviewId: "iv_001", respondentId: "User #4102", quote: "I tried Apple Pay but the button didn't work. Ended up using desktop instead.", sentiment: "negative", date: "Mar 4", topic: "Checkout", durationSec: 145 },
    ],
  },
  {
    id: "iv_002",
    insightId: "ins_002",
    status: "COMPLETED",
    targetCount: 15,
    sentCount: 15,
    responseCount: 12,
    questions: [
      { id: "q1", text: "How do you currently discover new creators?" },
      { id: "q2", text: "What frustrates you about the discovery experience?" },
    ],
    createdAt: "3d ago",
    responses: [
      { id: "resp_003", interviewId: "iv_002", respondentId: "User #2847", quote: "I spend 10 minutes scrolling but can never find creators I actually like. The recommendations feel completely random.", sentiment: "negative", date: "Mar 5", topic: "Discovery", durationSec: 210 },
      { id: "resp_004", interviewId: "iv_002", respondentId: "User #4521", quote: "Search works fine if I know the exact name, but I can't explore by topic or style at all.", sentiment: "mixed", date: "Mar 2", topic: "Search", durationSec: 165 },
    ],
  },
  {
    id: "iv_003",
    insightId: "ins_003",
    status: "COMPLETED",
    targetCount: 10,
    sentCount: 10,
    responseCount: 7,
    questions: [
      { id: "q1", text: "Why did you turn off notifications?" },
      { id: "q2", text: "What types of notifications would you want to keep?" },
    ],
    createdAt: "2d ago",
    responses: [
      { id: "resp_005", interviewId: "iv_003", respondentId: "User #1923", quote: "I got 47 notifications in one day. I just turned them all off. Now I miss important updates from creators I follow.", sentiment: "negative", date: "Mar 4", topic: "Notifications", durationSec: 195 },
    ],
  },
  {
    id: "iv_004",
    insightId: "ins_004",
    status: "IN_PROGRESS",
    targetCount: 12,
    sentCount: 12,
    responseCount: 4,
    questions: [
      { id: "q1", text: "What was your experience during onboarding?" },
      { id: "q2", text: "Did the interest categories feel relevant to you?" },
    ],
    createdAt: "1d ago",
    responses: [
      { id: "resp_006", interviewId: "iv_004", respondentId: "User #3102", quote: "After signing up I had no idea what to do. The onboarding asked me about categories I've never heard of.", sentiment: "negative", date: "Mar 3", topic: "Onboarding", durationSec: 155 },
      { id: "resp_007", interviewId: "iv_004", respondentId: "User #1087", quote: "I love the personalized feed since the last update! It's exactly what I want to see every time I open the app.", sentiment: "positive", date: "Mar 1", topic: "Feed", durationSec: 200 },
    ],
  },
]

// Flat list of all responses for convenience
export const interviewResponses: InterviewResponse[] = userInterviews.flatMap(iv => iv.responses)

export interface SupportTheme {
  theme: string
  tickets: number
  trend: "up" | "down" | "stable"
}

export const supportThemes: SupportTheme[] = [
  { theme: "Can't discover new creators", tickets: 23, trend: "up" },
  { theme: "Notification overload", tickets: 18, trend: "up" },
  { theme: "Search not returning results", tickets: 15, trend: "stable" },
  { theme: "Onboarding confusion", tickets: 12, trend: "down" },
  { theme: "Sharing flow broken on mobile", tickets: 8, trend: "stable" },
]

export interface NpsData {
  score: number
  previousScore: number
  promoters: number
  passives: number
  detractors: number
}

export const npsData: NpsData = { score: 42, previousScore: 38, promoters: 48, passives: 32, detractors: 20 }

// ---------------------------------------------------------------------------
// Step 2 — Analysis: Insight Lifecycle
// ---------------------------------------------------------------------------
export type InsightStatus = "detected" | "investigating" | "resolved" | "recommendation" | "approved" | "in_development"

export const insightStatusConfig: Record<InsightStatus, { label: string; color: string }> = {
  detected: { label: "Detected", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  investigating: { label: "Investigating", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  resolved: { label: "Resolved", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  recommendation: { label: "Recommendation", color: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  in_development: { label: "In Development", color: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" },
}

export const insightStatusOrder: InsightStatus[] = ["detected", "investigating", "resolved", "recommendation", "approved", "in_development"]

export interface InsightMessage {
  id: string
  role: "ai" | "user"
  content: string
  timestamp: string
  recommendation?: {
    title: string
    description: string
    estimatedImpact: string
    effort: "S" | "M" | "L" | "XL"
  }
}

export interface LifecycleInsight {
  id: string
  status: InsightStatus
  title: string
  metric: string
  source: string
  detectedAt: string
  topics: string[] // links to InterviewResponse.topic and SupportTheme.theme
  confidence?: number
  interviewId?: string // links to UserInterview
  prdGenerated?: boolean
  taskCount?: number
  messages: InsightMessage[]
}

export const lifecycleInsights: LifecycleInsight[] = [
  {
    id: "ins_001",
    status: "approved",
    title: "Mobile checkout abandonment rate +15%",
    metric: "Cart Abandonment",
    source: "Amplitude",
    detectedAt: "5d ago",
    topics: [],
    confidence: 92,
    interviewId: "iv_001",
    prdGenerated: true,
    taskCount: 6,
    messages: [
      { id: "m_001_1", role: "ai", content: "**Anomaly detected:** Mobile cart abandonment increased 15% over 2 weeks. Current rate: 78% (vs 34% desktop). Starting investigation.", timestamp: "5d ago" },
      { id: "m_001_2", role: "ai", content: "Investigation complete. Spike correlates with payment SDK v3.2 upgrade on Mar 1. **Step 3→4 transition** has 78% drop-off on mobile.\n\n**Root cause:** New SDK re-renders payment form on field focus change, causing input loss on mobile keyboards.\n\nSending interview requests to 20 affected users.", timestamp: "5d ago" },
      { id: "m_001_3", role: "user", content: "How many users are affected weekly?", timestamp: "4d ago" },
      { id: "m_001_4", role: "ai", content: "From Amplitude data:\n\n- **~2,400 users/week** reach mobile checkout\n- **~1,870** abandon at Step 3→4\n- Average cart value: **$24**\n- Estimated weekly revenue loss: **$11.2K**", timestamp: "4d ago" },
      { id: "m_001_5", role: "ai", content: "**14 of 20 interviews completed.** Key themes:\n\n> \"The payment page reloads every time I switch fields\"\n> \"I gave up after entering my card twice\"\n\n**92% confidence** — quantitative and qualitative data integrated.", timestamp: "3d ago", recommendation: { title: "Simplify to 2-step mobile checkout", description: "Replace 5-step payment flow with: (1) Review cart, (2) One-tap payment via Apple Pay / Google Pay. Fall back to saved cards, then manual entry.", estimatedImpact: "Recover ~$45K/month in abandoned carts", effort: "M" } },
      { id: "m_001_6", role: "user", content: "Approved. Generate the PRD and create tasks.", timestamp: "2d ago" },
      { id: "m_001_7", role: "ai", content: "PRD generated and **6 tasks** created in Linear:\n\n1. Implement Apple Pay / Google Pay integration\n2. Design 2-step checkout flow\n3. Build cart review component\n4. Add payment method fallback logic\n5. Write checkout flow tests\n6. Set up A/B experiment\n\nGitHub branch: `feat/mobile-checkout-v2`", timestamp: "2d ago" },
    ],
  },
  {
    id: "ins_002",
    status: "recommendation",
    title: "Creator discovery page 68% drop-off",
    metric: "Discovery Engagement",
    source: "Amplitude",
    detectedAt: "3d ago",
    topics: ["Discovery"],
    confidence: 86,
    interviewId: "iv_002",
    messages: [
      { id: "m_002_1", role: "ai", content: "**Anomaly detected:** Discovery page drop-off is 68%. Users spend only 14s before leaving — 13.7x lower than curated feeds.", timestamp: "3d ago" },
      { id: "m_002_2", role: "ai", content: "Investigation complete. Core issue: **zero personalization** in discovery algorithm. Shows globally trending creators regardless of user preferences.\n\n- 14s avg session vs 3.2min on curated feeds\n- 23 support tickets about discovery quality\n- Users who discover a creator have **4.1x higher** 30-day retention\n\nSending 15 interview requests.", timestamp: "3d ago" },
      { id: "m_002_3", role: "user", content: "What are users saying?", timestamp: "2d ago" },
      { id: "m_002_4", role: "ai", content: "12 of 15 responded. Consistent feedback:\n\n> \"I scroll for 10 minutes and can't find anyone I like\"\n> \"The recommendations feel completely random\"\n> \"I only find creators through friends, never through the app\"\n\nPattern: users want **interest-based** recommendations, not popularity-based. Confidence: **86%**.", timestamp: "2d ago" },
      { id: "m_002_5", role: "ai", content: "Quantitative + qualitative integrated. Generating recommendation.", timestamp: "1d ago", recommendation: { title: "AI-powered creator discovery feed", description: "Personalized recommendations based on interests, interaction history, and content affinity. Include \"Because you follow X\" explanations.", estimatedImpact: "+40% discovery engagement, +15% follow rate", effort: "L" } },
    ],
  },
  {
    id: "ins_003",
    status: "resolved",
    title: "Notification opt-out rate 3x industry average",
    metric: "Notification Opt-in",
    source: "Amplitude",
    detectedAt: "2d ago",
    topics: ["Notifications"],
    confidence: 79,
    interviewId: "iv_003",
    messages: [
      { id: "m_003_1", role: "ai", content: "**Anomaly detected:** Push notification opt-out rate is 42% within 7 days — 3x industry average (~14%). Investigating.", timestamp: "2d ago" },
      { id: "m_003_2", role: "ai", content: "Findings:\n\n- Users receive **47 notifications/day** (8x recommended)\n- **No preference controls** — all or nothing\n- Opt-out users have **2.8x lower** 30-day retention\n\nSending 10 interview requests to recent opt-out users.", timestamp: "2d ago" },
      { id: "m_003_3", role: "ai", content: "7 of 10 interviews completed:\n\n> \"I got 47 notifications in one day. I just turned them all off.\"\n> \"I want creator updates, but not likes and comments.\"\n\n**Insight resolved** — quant + qual integrated. Confidence: **79%**. Ready for recommendation.", timestamp: "1d ago" },
      { id: "m_003_4", role: "user", content: "What notification types get the most engagement?", timestamp: "1d ago" },
      { id: "m_003_5", role: "ai", content: "From Amplitude:\n\n- **New content from followed creators:** 34% open rate\n- **Someone followed you:** 22% open rate\n- **Likes on your content:** 4% open rate\n- **Comments on others' content:** 2% open rate\n\nBottom two categories = **72% of all notifications** but only **3% of engagement**. Strong case for priority-based batching. Generating recommendation next.", timestamp: "1d ago" },
    ],
  },
  {
    id: "ins_004",
    status: "investigating",
    title: "Onboarding Step 3 has 52% abandonment",
    metric: "Onboarding Completion",
    source: "Amplitude",
    detectedAt: "1d ago",
    topics: ["Onboarding"],
    confidence: 64,
    interviewId: "iv_004",
    messages: [
      { id: "m_004_1", role: "ai", content: "**Anomaly detected:** Onboarding completion is 34%. Step 3 (interest selection) has 52% abandonment. Completers have **4.2x higher** 30-day retention.", timestamp: "1d ago" },
      { id: "m_004_2", role: "ai", content: "Investigating. Initial findings:\n\n- Users spend **8 seconds** on Step 3 before leaving\n- Only 6 broad interest categories\n- Users selecting 3+ interests have **67% higher** engagement\n\nSent 12 interviews — 4 returned so far. Confidence: **64%**.", timestamp: "1d ago" },
      { id: "m_004_3", role: "user", content: "What are the current 6 categories?", timestamp: "12h ago" },
      { id: "m_004_4", role: "ai", content: "**Art, Music, Tech, Lifestyle, Gaming, Education** — very broad. Successful platforms use 20-40 specific subcategories. Waiting for more interview responses to raise confidence.", timestamp: "12h ago" },
    ],
  },
  {
    id: "ins_005",
    status: "detected",
    title: "API P95 latency spike to 890ms at peak hours",
    metric: "API Response Time",
    source: "Amplitude",
    detectedAt: "2h ago",
    topics: [],
    confidence: 42,
    messages: [
      { id: "m_005_1", role: "ai", content: "**Anomaly detected:** API P95 latency increased from 120ms to 890ms during peak hours (2-6pm UTC). Feed endpoint accounts for 68% of peak load. 12% of requests timing out.\n\nStarting automated investigation — analyzing endpoint patterns, database queries, and cache hit rates.", timestamp: "2h ago" },
    ],
  },
]

// ---------------------------------------------------------------------------
// Step 3 — Development: Features
// ---------------------------------------------------------------------------
export type FeatureStatus = "Proposed" | "Approved" | "In Progress" | "Released"

export interface Feature {
  id: string
  name: string
  description: string
  insightId: string
  impactScore: number
  confidence: number
  effort: "S" | "M" | "L" | "XL"
  status: FeatureStatus
}

export const features: Feature[] = [
  { id: "feat_001", name: "Creator Discovery Feed", description: "Personalized feed that surfaces relevant creators based on user interests, interaction history, and trending content.", insightId: "ins_002", impactScore: 9.1, confidence: 86, effort: "L", status: "Proposed" },
  { id: "feat_002", name: "Smart Notification Batching", description: "Intelligent grouping of notifications by priority and context, delivered at optimal times based on user behavior.", insightId: "ins_003", impactScore: 8.4, confidence: 79, effort: "M", status: "In Progress" },
  { id: "feat_003", name: "Onboarding Personalization", description: "Dynamic onboarding flow that adapts based on user type, interests, and engagement patterns.", insightId: "ins_004", impactScore: 8.1, confidence: 91, effort: "M", status: "Released" },
  { id: "feat_004", name: "Semantic Search Upgrade", description: "AI-powered search that understands intent and context for long-tail queries.", insightId: "ins_001", impactScore: 7.9, confidence: 74, effort: "L", status: "Approved" },
  { id: "feat_005", name: "One-tap Share Sheet", description: "Streamlined sharing flow with platform-specific previews and one-tap actions.", insightId: "ins_005", impactScore: 7.5, confidence: 68, effort: "S", status: "Proposed" },
]

// ---------------------------------------------------------------------------
// Step 3 — Development: Pull Requests
// ---------------------------------------------------------------------------
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

export const pullRequests: PullRequest[] = [
  { id: "pr_001", number: 149, title: "feat: implement interest-based onboarding flow", branch: "feat/onboarding-personalization", baseBranch: "main", featureName: "Onboarding Personalization", status: "merged", additions: 487, deletions: 123, filesChanged: 14, createdAt: "3d ago", reviewStatus: "approved", author: "iterate-ai", authorAvatar: "IA" },
  { id: "pr_002", number: 147, title: "feat: add batch queue service for notifications", branch: "feat/notification-batch-queue", baseBranch: "main", featureName: "Smart Notification Batching", status: "merged", additions: 312, deletions: 28, filesChanged: 9, createdAt: "2d ago", reviewStatus: "approved", author: "iterate-ai", authorAvatar: "IA" },
  { id: "pr_003", number: 145, title: "feat: notification preferences UI", branch: "feat/notification-preferences-ui", baseBranch: "main", featureName: "Smart Notification Batching", status: "open", additions: 234, deletions: 45, filesChanged: 8, createdAt: "1d ago", reviewStatus: "pending", author: "iterate-ai", authorAvatar: "IA" },
  { id: "pr_004", number: 142, title: "feat: notification grouping algorithm", branch: "feat/notification-grouping", baseBranch: "main", featureName: "Smart Notification Batching", status: "merged", additions: 189, deletions: 12, filesChanged: 5, createdAt: "4d ago", reviewStatus: "approved", author: "iterate-ai", authorAvatar: "IA" },
  { id: "pr_005", number: 151, title: "feat: optimal notification timing engine", branch: "feat/notification-timing-engine", baseBranch: "main", featureName: "Smart Notification Batching", status: "draft", additions: 156, deletions: 8, filesChanged: 4, createdAt: "6h ago", reviewStatus: "none", author: "iterate-ai", authorAvatar: "IA" },
]

// ---------------------------------------------------------------------------
// Git Repository Context
// ---------------------------------------------------------------------------
export const repoInfo = {
  owner: "acme-corp",
  name: "creator-platform",
  fullName: "acme-corp/creator-platform",
  defaultBranch: "main",
  url: "https://github.com/acme-corp/creator-platform",
  openPrs: 2,
  branches: 8,
  lastPush: "6h ago",
}

// ---------------------------------------------------------------------------
// Step 4 — Results: Experiments
// ---------------------------------------------------------------------------
export type ExperimentStatus = "running" | "completed" | "paused"

export interface ExperimentVariant {
  name: string
  users: number
  metric: number
  change: number
}

export interface Experiment {
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

export const experiments: Experiment[] = [
  {
    id: "exp_001", name: "Personalized Onboarding v2", featureName: "Onboarding Personalization", branch: "feat/onboarding-personalization", status: "completed", metric: "Onboarding Completion", startedAt: "14d ago", significance: 98,
    variants: [{ name: "Control", users: 4820, metric: 34, change: 0 }, { name: "Personalized", users: 4795, metric: 51, change: 50 }],
  },
  {
    id: "exp_002", name: "Notification Batching", featureName: "Smart Notification Batching", branch: "feat/notification-batch-queue", status: "running", metric: "Notification Opt-in Rate", startedAt: "3d ago", significance: 72,
    variants: [{ name: "Control", users: 2100, metric: 58, change: 0 }, { name: "Batched", users: 2150, metric: 71, change: 22.4 }],
  },
  {
    id: "exp_003", name: "Search Relevance v3", featureName: "Semantic Search Upgrade", branch: "feat/semantic-search-v3", status: "completed", metric: "Search Success Rate", startedAt: "21d ago", significance: 95,
    variants: [{ name: "Control", users: 6200, metric: 33, change: 0 }, { name: "Semantic", users: 6180, metric: 47, change: 42.4 }],
  },
  {
    id: "exp_004", name: "Creator Recommendations", featureName: "Creator Discovery Feed", branch: "feat/creator-discovery-feed", status: "running", metric: "Creator Follow Rate", startedAt: "5d ago", significance: 61,
    variants: [{ name: "Control", users: 1800, metric: 8.2, change: 0 }, { name: "AI Recommended", users: 1820, metric: 11.4, change: 39 }],
  },
  {
    id: "exp_005", name: "Simplified Sharing", featureName: "One-tap Share Sheet", branch: "feat/one-tap-share", status: "paused", metric: "Share Completion Rate", startedAt: "10d ago", significance: 45,
    variants: [{ name: "Control", users: 950, metric: 3.1, change: 0 }, { name: "One-tap", users: 980, metric: 4.8, change: 54.8 }],
  },
]

// ---------------------------------------------------------------------------
// Dashboard: Activity Feed
// ---------------------------------------------------------------------------
export const recentActivity = [
  { type: "insight" as const, message: "AI generated new insight: Creator discovery drop-off", time: "2 min ago" },
  { type: "suggestion" as const, message: "AI suggests: Interview 5 users with discovery drop-off", time: "2 min ago" },
  { type: "pr" as const, message: "PR #145 generated: Notification preferences UI", time: "3h ago" },
  { type: "experiment" as const, message: "Experiment started: Notification Batching A/B test", time: "5h ago" },
  { type: "result" as const, message: "Personalized Onboarding: +50% completion (98% significance)", time: "1d ago" },
  { type: "data" as const, message: "Imported 2.3k new events from Amplitude", time: "1d ago" },
]

// ---------------------------------------------------------------------------
// Chat Thread
// ---------------------------------------------------------------------------
export interface ThreadMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export interface Thread {
  id: string
  title: string
  updatedAt: string
  preview: string
  messages: ThreadMessage[]
}

export const threads: Thread[] = [
  {
    id: "thread_001",
    title: "Creator discovery deep dive",
    updatedAt: "9:05 AM",
    preview: "Effort estimate: Large (L) — approximately 4-5 weeks...",
    messages: [
      {
        id: "msg_001",
        role: "assistant",
        content: "Good morning! Here's your daily product briefing:\n\n**Key highlights:**\n- DAU up 8.2% to 12,847\n- Mobile checkout abandonment insight has been approved — 6 tasks created in Linear\n- Creator discovery drop-off (68%) detected 3 days ago, recommendation ready for review\n\nWhat would you like to focus on today?",
        createdAt: "9:00 AM",
      },
      {
        id: "msg_002",
        role: "user",
        content: "Tell me more about the creator discovery issue",
        createdAt: "9:02 AM",
      },
      {
        id: "msg_003",
        role: "assistant",
        content: "**Creator Discovery Page — 68% Drop-off**\n\nUsers spend only 14 seconds on discovery before leaving (vs 3.2 min on curated feeds). The core issue is zero personalization — the algorithm shows globally trending creators regardless of user preferences.\n\n**Evidence:**\n- 12/15 interview respondents confirmed\n- 23 support tickets about discovery quality\n- Users who discover a creator have 4.1x higher 30-day retention\n\n**Recommendation ready:** AI-powered creator discovery feed with interest-based matching. Estimated impact: +40% discovery engagement.\n\nWould you like to approve this recommendation?",
        createdAt: "9:02 AM",
      },
      {
        id: "msg_004",
        role: "user",
        content: "What's the effort estimate?",
        createdAt: "9:05 AM",
      },
      {
        id: "msg_005",
        role: "assistant",
        content: "Effort estimate: **Large (L)**\n\nBreakdown:\n- Recommendation engine backend: ~2 weeks\n- Interest profiling pipeline: ~1 week\n- New discovery UI: ~1 week\n- A/B test setup: ~2 days\n\nTotal: approximately 4-5 weeks with 2 engineers. The mobile checkout fix (Medium effort) is already in progress and won't conflict.\n\nShall I generate a PRD and create tasks?",
        createdAt: "9:05 AM",
      },
    ],
  },
  {
    id: "thread_002",
    title: "Notification batching strategy",
    updatedAt: "Yesterday",
    preview: "Smart batching will group by priority. Top 2 categories...",
    messages: [
      {
        id: "msg_010",
        role: "user",
        content: "What's the plan for notification batching?",
        createdAt: "3:00 PM",
      },
      {
        id: "msg_011",
        role: "assistant",
        content: "Current notification system sends **47 notifications/day** per user — 8x the recommended amount. The plan:\n\n1. **Priority tiers:** Creator updates (high), follows (medium), likes/comments (low)\n2. **Smart batching:** Low-priority items grouped into 2 daily digests\n3. **Optimal timing:** Deliver based on user's historical engagement patterns\n\nPR #145 (preferences UI) is open, PR #151 (timing engine) is in draft.",
        createdAt: "3:01 PM",
      },
    ],
  },
  {
    id: "thread_003",
    title: "Mobile checkout fix status",
    updatedAt: "Mar 6",
    preview: "6 tasks created in Linear. GitHub branch: feat/mobile...",
    messages: [
      {
        id: "msg_020",
        role: "user",
        content: "Status on the mobile checkout fix?",
        createdAt: "10:00 AM",
      },
      {
        id: "msg_021",
        role: "assistant",
        content: "**Mobile checkout — Approved & In Development**\n\nPRD generated, **6 tasks** in Linear:\n1. Apple Pay / Google Pay integration\n2. 2-step checkout flow design\n3. Cart review component\n4. Payment fallback logic\n5. Checkout flow tests\n6. A/B experiment setup\n\nBranch: `feat/mobile-checkout-v2`\nEstimated recovery: **~$45K/month** in abandoned carts.",
        createdAt: "10:01 AM",
      },
    ],
  },
  {
    id: "thread_004",
    title: "Onboarding categories review",
    updatedAt: "Mar 5",
    preview: "Current 6 categories are too broad. Successful platforms...",
    messages: [
      {
        id: "msg_030",
        role: "user",
        content: "How should we redesign the onboarding categories?",
        createdAt: "2:00 PM",
      },
      {
        id: "msg_031",
        role: "assistant",
        content: "Current categories (**Art, Music, Tech, Lifestyle, Gaming, Education**) are too broad — users spend only 8 seconds before abandoning.\n\n**Recommendation:** Expand to 24 subcategories with visual previews. Let users select 3+ interests. Show creator samples for each category.\n\nThe personalized onboarding experiment already shows **+50% completion** (98% significance). Building on that success.",
        createdAt: "2:01 PM",
      },
    ],
  },
]
