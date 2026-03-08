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
  { name: "Sentry", logoSrc: "/logos/sentry.svg", status: "disconnected", description: "Error monitoring", lastSync: "—", eventsIngested: "—", errorRate: "—" },
  { name: "Slack", logoSrc: "/logos/slack.svg", status: "disconnected", description: "User feedback", lastSync: "—", eventsIngested: "—", errorRate: "—" },
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
// Step 1 — Data: Qualitative
// ---------------------------------------------------------------------------
export type Sentiment = "positive" | "negative" | "mixed"

export interface Interview {
  user: string
  quote: string
  date: string
  sentiment: Sentiment
  topic: string
}

export const interviews: Interview[] = [
  { user: "User #2847", quote: "I spend 10 minutes scrolling but can never find creators I actually like. The recommendations feel completely random.", date: "Mar 5", sentiment: "negative", topic: "Discovery" },
  { user: "User #1923", quote: "I got 47 notifications in one day. I just turned them all off. Now I miss important updates from creators I follow.", date: "Mar 4", sentiment: "negative", topic: "Notifications" },
  { user: "User #3102", quote: "After signing up I had no idea what to do. The onboarding asked me about categories I've never heard of.", date: "Mar 3", sentiment: "negative", topic: "Onboarding" },
  { user: "User #4521", quote: "Search works fine if I know the exact name, but I can't explore by topic or style at all.", date: "Mar 2", sentiment: "mixed", topic: "Search" },
  { user: "User #1087", quote: "I love the personalized feed since the last update! It's exactly what I want to see every time I open the app.", date: "Mar 1", sentiment: "positive", topic: "Feed" },
]

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
// Step 2 — Analysis: AI Chat
// ---------------------------------------------------------------------------
export interface ChatMessage {
  id: string
  role: "ai" | "user"
  content: string
  timestamp: string
}

export const analysisChatMessages: ChatMessage[] = [
  { id: "msg_001", role: "ai", content: "I've completed the analysis of **12,438 events** from Amplitude and **5 user interviews**. I identified **8 insights** across engagement, retention, conversion, and performance. Here are the most critical findings:", timestamp: "2 min ago" },
  { id: "msg_002", role: "ai", content: "**#1 Creator Discovery (Impact 9.1)** — 68% of users drop off on the discovery page. Session time is only 14s compared to 3.2min on curated feeds. 23 user interviews confirm this is a top pain point. I recommend building a **Creator Discovery Feed**.\n\n**#2 Notification Overload (Impact 8.4)** — 42% of users disabled push notifications within 7 days. Opt-out rate is 3x the industry average. I recommend implementing **Smart Notification Batching**.", timestamp: "2 min ago" },
  { id: "msg_003", role: "user", content: "The discovery issue sounds critical. Can you tell me more about what users are saying?", timestamp: "1 min ago" },
  { id: "msg_004", role: "ai", content: "From the interview data:\n\n> *\"I spend 10 minutes scrolling but can never find creators I actually like. The recommendations feel completely random.\"* — User #2847\n\n> *\"Search works fine if I know the exact name, but I can't explore by topic or style at all.\"* — User #4521\n\nThe core issue is **passive discovery** — users have no way to find creators aligned with their interests without already knowing who they are. I'd suggest conducting **5 more targeted interviews** with users who dropped off the discovery page to validate the specific feature direction before moving to development.", timestamp: "1 min ago" },
  { id: "msg_005", role: "user", content: "Good insight. Let's plan those interviews. What about the notification issue — is that ready to move to development?", timestamp: "just now" },
  { id: "msg_006", role: "ai", content: "The notification batching insight has **79% confidence** — strong enough to proceed. Here's what I recommend:\n\n1. **Move to Development** → Generate a feature spec and tasks for Smart Notification Batching\n2. **Collect more data first** → Survey the 42% who opted out to refine the batching algorithm\n\nI'd recommend option 2 first to increase confidence, but option 1 is viable if you want to ship faster. Want me to generate the feature proposal?", timestamp: "just now" },
]

// ---------------------------------------------------------------------------
// Step 2 — Analysis: AI Insights
// ---------------------------------------------------------------------------
export type InsightCategory = "engagement" | "retention" | "conversion" | "performance"

export interface Insight {
  id: string
  problem: string
  evidence: string
  recommendation: string
  impactScore: number
  confidence: number
  source: string
  category: InsightCategory
  createdAt: string
}

export const insights: Insight[] = [
  { id: "ins_001", problem: "Users struggle to discover creators relevant to their interests", evidence: "68% drop-off on discovery page. Session time 14s vs 3.2min on curated feeds. 23 user interviews confirm.", recommendation: "Creator Discovery Feed", impactScore: 9.1, confidence: 86, source: "Amplitude · 12.4k events", category: "engagement", createdAt: "2h ago" },
  { id: "ins_002", problem: "Notification overload causing users to disable all notifications", evidence: "42% of users disabled push notifications within 7 days. Opt-out rate 3x industry average.", recommendation: "Smart Notification Batching", impactScore: 8.4, confidence: 79, source: "Amplitude · 8.2k events", category: "retention", createdAt: "5h ago" },
  { id: "ins_003", problem: "New users drop off before completing onboarding", evidence: "Only 34% complete onboarding. Step 3 has 52% abandonment. Completers have 4.2x higher 30-day retention.", recommendation: "Onboarding Personalization", impactScore: 8.1, confidence: 91, source: "Amplitude · 6.8k events", category: "conversion", createdAt: "1d ago" },
  { id: "ins_004", problem: "Search returns irrelevant results for long-tail queries", evidence: "67% refinement rate for queries >3 words. 2.8 searches avg before finding content. 41% exit rate.", recommendation: "Semantic Search Upgrade", impactScore: 7.9, confidence: 74, source: "Amplitude · 15.1k events", category: "engagement", createdAt: "1d ago" },
  { id: "ins_005", problem: "Content sharing flow has too much friction", evidence: "Share CTR 12% but only 3.1% complete. 4 taps required vs competitor 2-tap flows.", recommendation: "One-tap Share Sheet", impactScore: 7.5, confidence: 68, source: "Amplitude · 9.4k events", category: "engagement", createdAt: "2d ago" },
  { id: "ins_006", problem: "Mobile checkout has 78% cart abandonment", evidence: "Desktop conversion 6.2% vs mobile 1.4%. Payment step 45s on mobile vs 18s desktop.", recommendation: "Mobile Checkout Redesign", impactScore: 7.2, confidence: 82, source: "Amplitude · 4.1k events", category: "conversion", createdAt: "3d ago" },
  { id: "ins_007", problem: "User profiles 60% incomplete on average", evidence: "22% have a bio. Profile completion correlates with 2.1x higher engagement.", recommendation: "Progressive Profile Nudges", impactScore: 6.8, confidence: 71, source: "Amplitude · 3.5k events", category: "engagement", createdAt: "4d ago" },
  { id: "ins_008", problem: "API response times spike during peak hours", evidence: "P95 latency 120ms→890ms from 2-6pm UTC. Feed endpoint: 68% of peak load. 12% requests timeout.", recommendation: "Feed API Caching Layer", impactScore: 6.5, confidence: 88, source: "Sentry · 2.3k errors", category: "performance", createdAt: "5d ago" },
]

// ---------------------------------------------------------------------------
// Step 2 — Analysis: AI Suggestions (feed back to Data)
// ---------------------------------------------------------------------------
export type SuggestionType = "interview" | "data_fetch" | "cohort_analysis"

export interface AiSuggestion {
  id: string
  type: SuggestionType
  title: string
  description: string
  priority: "high" | "medium" | "low"
  feedsBackTo: "Quantitative Data" | "Qualitative Data"
  relatedInsight: string
}

export const aiSuggestions: AiSuggestion[] = [
  { id: "sug_001", type: "interview", title: "Interview users with discovery drop-off", description: "23 users dropped off on the discovery page in the last 7 days. Schedule 5 interviews to understand specific pain points and expectations.", priority: "high", feedsBackTo: "Qualitative Data", relatedInsight: "ins_001" },
  { id: "sug_002", type: "data_fetch", title: "Connect Sentry for error correlation", description: "12% of sessions during peak hours may be affected by API timeouts. Import error logs to correlate with user drop-off patterns.", priority: "high", feedsBackTo: "Quantitative Data", relatedInsight: "ins_008" },
  { id: "sug_003", type: "cohort_analysis", title: "Run onboarding completion cohort analysis", description: "Compare 30-day behavior of onboarding completers vs non-completers. Identify the key activation moments that predict retention.", priority: "medium", feedsBackTo: "Quantitative Data", relatedInsight: "ins_003" },
  { id: "sug_004", type: "interview", title: "Survey notification opt-out users", description: "42% of users disabled notifications. Send a 3-question in-app survey to understand preferences and ideal frequency.", priority: "medium", feedsBackTo: "Qualitative Data", relatedInsight: "ins_002" },
  { id: "sug_005", type: "data_fetch", title: "Import Slack #feedback channel", description: "178 unprocessed messages in the last 30 days contain product feedback. Import and categorize for sentiment analysis.", priority: "low", feedsBackTo: "Qualitative Data", relatedInsight: "ins_005" },
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
  { id: "feat_001", name: "Creator Discovery Feed", description: "Personalized feed that surfaces relevant creators based on user interests, interaction history, and trending content.", insightId: "ins_001", impactScore: 9.1, confidence: 86, effort: "L", status: "Proposed" },
  { id: "feat_002", name: "Smart Notification Batching", description: "Intelligent grouping of notifications by priority and context, delivered at optimal times based on user behavior.", insightId: "ins_002", impactScore: 8.4, confidence: 79, effort: "M", status: "In Progress" },
  { id: "feat_003", name: "Onboarding Personalization", description: "Dynamic onboarding flow that adapts based on user type, interests, and engagement patterns.", insightId: "ins_003", impactScore: 8.1, confidence: 91, effort: "M", status: "Released" },
  { id: "feat_004", name: "Semantic Search Upgrade", description: "AI-powered search that understands intent and context for long-tail queries.", insightId: "ins_004", impactScore: 7.9, confidence: 74, effort: "L", status: "Approved" },
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
  featureName: string
  status: PrStatus
  additions: number
  deletions: number
  filesChanged: number
  createdAt: string
  reviewStatus: "approved" | "changes_requested" | "pending" | "none"
}

export const pullRequests: PullRequest[] = [
  { id: "pr_001", number: 149, title: "feat: implement interest-based onboarding flow", featureName: "Onboarding Personalization", status: "merged", additions: 487, deletions: 123, filesChanged: 14, createdAt: "3d ago", reviewStatus: "approved" },
  { id: "pr_002", number: 147, title: "feat: add batch queue service for notifications", featureName: "Smart Notification Batching", status: "merged", additions: 312, deletions: 28, filesChanged: 9, createdAt: "2d ago", reviewStatus: "approved" },
  { id: "pr_003", number: 145, title: "feat: notification preferences UI", featureName: "Smart Notification Batching", status: "open", additions: 234, deletions: 45, filesChanged: 8, createdAt: "1d ago", reviewStatus: "pending" },
  { id: "pr_004", number: 142, title: "feat: notification grouping algorithm", featureName: "Smart Notification Batching", status: "merged", additions: 189, deletions: 12, filesChanged: 5, createdAt: "4d ago", reviewStatus: "approved" },
  { id: "pr_005", number: 151, title: "feat: optimal notification timing engine", featureName: "Smart Notification Batching", status: "draft", additions: 156, deletions: 8, filesChanged: 4, createdAt: "6h ago", reviewStatus: "none" },
]

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
  status: ExperimentStatus
  metric: string
  startedAt: string
  significance: number
  variants: ExperimentVariant[]
}

export const experiments: Experiment[] = [
  {
    id: "exp_001", name: "Personalized Onboarding v2", featureName: "Onboarding Personalization", status: "completed", metric: "Onboarding Completion", startedAt: "14d ago", significance: 98,
    variants: [{ name: "Control", users: 4820, metric: 34, change: 0 }, { name: "Personalized", users: 4795, metric: 51, change: 50 }],
  },
  {
    id: "exp_002", name: "Notification Batching", featureName: "Smart Notification Batching", status: "running", metric: "Notification Opt-in Rate", startedAt: "3d ago", significance: 72,
    variants: [{ name: "Control", users: 2100, metric: 58, change: 0 }, { name: "Batched", users: 2150, metric: 71, change: 22.4 }],
  },
  {
    id: "exp_003", name: "Search Relevance v3", featureName: "Semantic Search Upgrade", status: "completed", metric: "Search Success Rate", startedAt: "21d ago", significance: 95,
    variants: [{ name: "Control", users: 6200, metric: 33, change: 0 }, { name: "Semantic", users: 6180, metric: 47, change: 42.4 }],
  },
  {
    id: "exp_004", name: "Creator Recommendations", featureName: "Creator Discovery Feed", status: "running", metric: "Creator Follow Rate", startedAt: "5d ago", significance: 61,
    variants: [{ name: "Control", users: 1800, metric: 8.2, change: 0 }, { name: "AI Recommended", users: 1820, metric: 11.4, change: 39 }],
  },
  {
    id: "exp_005", name: "Simplified Sharing", featureName: "One-tap Share Sheet", status: "paused", metric: "Share Completion Rate", startedAt: "10d ago", significance: 45,
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
