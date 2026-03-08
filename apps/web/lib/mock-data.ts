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
  { label: "Data", sublabel: "Quantitative / Qualitative", description: "Product signals & user voices", status: "complete", detail: "84.2k events · 5 interviews · NPS 38", href: "/data" },
  { label: "Analysis", sublabel: "AI Insights", description: "Insights & next-step suggestions", status: "active", detail: "5 insights · 1 in development", href: "/analysis" },
  { label: "Development", sublabel: "Features & PRs", description: "Features & pull requests", status: "pending", detail: "5 features · 5 PRs generated", href: "/development" },
  { label: "Results", sublabel: "Measurement", description: "A/B tests & impact measurement", status: "pending", detail: "4 experiments · 2 significant", href: "/results" },
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
  { name: "Amplitude", logoSrc: "/logos/amplitude.svg", status: "connected", description: "Product analytics", lastSync: "2 min ago", eventsIngested: "84,230", errorRate: "0.01%" },
  { name: "Mixpanel", logoSrc: "/logos/mixpanel.svg", status: "disconnected", description: "Product analytics", lastSync: "—", eventsIngested: "—", errorRate: "—" },
  { name: "Sentry", logoSrc: "/logos/sentry.svg", status: "connected", description: "Error monitoring", lastSync: "5 min ago", eventsIngested: "6,142", errorRate: "0.03%" },
  { name: "Slack", logoSrc: "/logos/slack.svg", status: "connected", description: "User feedback", lastSync: "8 min ago", eventsIngested: "2,340", errorRate: "0%" },
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
  { name: "DAU", value: "84,230", change: "+3.4%", trend: "up" },
  { name: "Booking Rate", value: "2.1%", change: "-1.8pp", trend: "down" },
  { name: "Save Rate", value: "31.4%", change: "+4.2pp", trend: "up" },
  { name: "Avg Session", value: "6m 12s", change: "+18s", trend: "up" },
]

export interface TopEvent {
  name: string
  count: number
  change: string
}

export const topEvents: TopEvent[] = [
  { name: "hotel_search", count: 142800, change: "+8%" },
  { name: "hotel_detail_viewed", count: 89340, change: "+12%" },
  { name: "hotel_saved", count: 26480, change: "+24%" },
  { name: "book_button_clicked", count: 5890, change: "-18%" },
  { name: "booking_started", count: 3240, change: "-22%" },
  { name: "booking_completed", count: 1780, change: "-15%" },
]

export interface FunnelStep {
  step: string
  users: number
  rate: number
}

export const funnelData: FunnelStep[] = [
  { step: "Hotel Search", users: 142800, rate: 100 },
  { step: "Hotel Detail View", users: 89340, rate: 62.6 },
  { step: "Book Button Click", users: 5890, rate: 4.1 },
  { step: "Booking Started", users: 3240, rate: 2.3 },
  { step: "Booking Completed", users: 1780, rate: 1.2 },
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
    targetCount: 18,
    sentCount: 18,
    responseCount: 14,
    questions: [
      { id: "q1", text: "How do you decide between saving a hotel and booking it?" },
      { id: "q2", text: "What stops you from completing a booking on ahoda?" },
    ],
    createdAt: "3d ago",
    responses: [
      { id: "resp_001", interviewId: "iv_001", respondentId: "User #8421", quote: "I saved 15 hotels in Bali but ended up booking on another site. Your Book button just says 'Book Now' with no price — I don't trust clicking something when I don't know the cost.", sentiment: "negative", date: "Mar 6", topic: "Booking", durationSec: 195 },
      { id: "resp_002", interviewId: "iv_001", respondentId: "User #3917", quote: "The booking flow has 6 steps. I gave up at the guest details page because it asked for my passport number before even confirming the price.", sentiment: "negative", date: "Mar 6", topic: "Booking", durationSec: 160 },
      { id: "resp_003", interviewId: "iv_001", respondentId: "User #6204", quote: "I always use Save to compare hotels, but there's no way to book from my Saved list. I have to go back to each hotel page one by one.", sentiment: "negative", date: "Mar 5", topic: "Saved List", durationSec: 140 },
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
      { id: "q1", text: "Did the final booking price match what you expected?" },
      { id: "q2", text: "How do you feel about the pricing transparency on ahoda?" },
    ],
    createdAt: "2d ago",
    responses: [
      { id: "resp_004", interviewId: "iv_002", respondentId: "User #2093", quote: "When I clicked Book, the price jumped from $89 to $127 with hidden fees. I immediately closed the tab.", sentiment: "negative", date: "Mar 6", topic: "Pricing", durationSec: 175 },
      { id: "resp_005", interviewId: "iv_002", respondentId: "User #5718", quote: "I wish the total price was shown upfront on the listing. The 'from $XX' pricing feels deceptive — I don't want to go through 3 pages just to find out the real cost.", sentiment: "negative", date: "Mar 5", topic: "Pricing", durationSec: 210 },
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
      { id: "q1", text: "Describe your experience booking a hotel on your phone." },
      { id: "q2", text: "What made you abandon the booking on mobile?" },
    ],
    createdAt: "2d ago",
    responses: [
      { id: "resp_006", interviewId: "iv_003", respondentId: "User #4381", quote: "On my phone, the Book button is below three screens of hotel photos. By the time I find it, I've forgotten the price.", sentiment: "negative", date: "Mar 5", topic: "Mobile", durationSec: 185 },
    ],
  },
  {
    id: "iv_004",
    insightId: "ins_004",
    status: "IN_PROGRESS",
    targetCount: 15,
    sentCount: 15,
    responseCount: 5,
    questions: [
      { id: "q1", text: "How do you use the Saved hotels feature?" },
      { id: "q2", text: "What would make you book a hotel you've saved?" },
    ],
    createdAt: "1d ago",
    responses: [
      { id: "resp_007", interviewId: "iv_004", respondentId: "User #7856", quote: "I have 23 hotels saved from three different trips. I open ahoda every night to browse, but I always end up booking on Booking.com because their checkout is faster.", sentiment: "mixed", date: "Mar 7", topic: "Saved List", durationSec: 230 },
      { id: "resp_008", interviewId: "iv_004", respondentId: "User #1294", quote: "Love the Save feature for trip planning! But the actual booking part feels like a separate, worse app.", sentiment: "mixed", date: "Mar 7", topic: "Booking", durationSec: 155 },
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
  { theme: "Booking flow too many steps", tickets: 47, trend: "up" },
  { theme: "Price changes after clicking Book", tickets: 31, trend: "up" },
  { theme: "Can't book from Saved list", tickets: 24, trend: "stable" },
  { theme: "Mobile booking page too slow", tickets: 18, trend: "down" },
  { theme: "Search filters not saving", tickets: 9, trend: "stable" },
]

export interface NpsData {
  score: number
  previousScore: number
  promoters: number
  passives: number
  detractors: number
}

export const npsData: NpsData = { score: 38, previousScore: 35, promoters: 42, passives: 34, detractors: 24 }

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
    status: "in_development",
    title: "Book button CTR 3.2% vs Save button 34.1% — 10.6x gap",
    metric: "Booking Conversion",
    source: "Amplitude",
    detectedAt: "3d ago",
    topics: ["Booking flow", "Saved list"],
    confidence: 94,
    interviewId: "iv_001",
    prdGenerated: true,
    taskCount: 5,
    messages: [
      { id: "m_001_1", role: "ai", content: "**Anomaly detected:** Book button CTR is **3.2%** while Save button CTR is **34.1%** — a 10.6x gap. Industry average booking CTR for hotel platforms is 8-12%.\n\nThis represents significant lost revenue. Starting automated investigation — analyzing click patterns, user flows, and conversion funnels.", timestamp: "3d ago" },
      { id: "m_001_2", role: "ai", content: "Investigation complete. Three root causes identified:\n\n1. **No price on Book button** — Button shows only \"Book Now\" with no price indicator. Users don't know what they're committing to.\n2. **6-step checkout flow** — Industry standard is 2-3 steps. Current: Hotel confirm → Guest details → Passport → Payment → Review → Confirm.\n3. **No booking from Saved list** — 26,480 users save hotels weekly but must navigate back to individual hotel pages to book.\n\n**Booking funnel breakdown:**\n- Hotel Detail View: 89,340\n- Book Button Click: 5,890 (6.6% of views)\n- Guest Details: 3,240 (55% of clicks)\n- Payment Entered: 2,100 (65%)\n- Booking Completed: 1,780 (85%)\n\nBiggest drop-off: **Detail View → Book Click**. Sending 18 interview requests to users who saved 5+ hotels but booked 0.", timestamp: "3d ago" },
      { id: "m_001_3", role: "user", content: "What are users saying about the Book button?", timestamp: "2d ago" },
      { id: "m_001_4", role: "ai", content: "**14 of 18 interviews completed.** Consistent themes:\n\n> \"I saved 15 hotels in Bali but ended up booking on another site. Your Book button just says 'Book Now' with no price — I don't trust clicking it.\"\n\n> \"The booking flow has 6 steps. I gave up at guest details because it asked for my passport number before confirming the price.\"\n\n> \"I always use Save to compare hotels, but there's no way to book from my Saved list. I have to go back to each hotel page one by one.\"\n\nPattern: users **trust the Save feature** but **distrust the Book action** due to price opacity and friction. Users who save 5+ hotels have **4.7x higher** lifetime value but convert at only 8%.\n\nConfidence: **94%**.", timestamp: "2d ago" },
      { id: "m_001_5", role: "ai", content: "Quantitative + qualitative data integrated. Generating recommendation.", timestamp: "1d ago", recommendation: { title: "One-tap Booking from Saved List", description: "Add 'Book $XXX' CTA with transparent total price directly on Saved list cards. Reduce checkout to 2 steps: (1) Confirm dates & guests, (2) Pay via Apple Pay / Google Pay or saved card. Show full price breakdown inline.", estimatedImpact: "+180% booking conversion from Saved, ~$2.4M ARR", effort: "M" } },
      { id: "m_001_6", role: "user", content: "Approved. Create the feature and generate PRs.", timestamp: "1d ago" },
      { id: "m_001_7", role: "ai", content: "Feature created: **One-tap Booking from Saved List** with 5 tasks:\n\n1. Add \"Book $XXX\" CTA to Saved list cards\n2. Implement 2-step checkout (Confirm → Pay)\n3. Apple Pay / Google Pay integration\n4. Full price breakdown component\n5. A/B experiment setup\n\nPRs being generated on branch `feat/one-tap-booking`. Experiment will run on 50% of Saved list traffic.", timestamp: "1d ago" },
    ],
  },
  {
    id: "ins_002",
    status: "recommendation",
    title: "Booking abandonment 78% at price confirmation step",
    metric: "Booking Completion",
    source: "Amplitude",
    detectedAt: "2d ago",
    topics: ["Price"],
    confidence: 88,
    interviewId: "iv_002",
    messages: [
      { id: "m_002_1", role: "ai", content: "**Anomaly detected:** 78% of users who click Book abandon at the price confirmation step. Price shown on confirmation averages **42% higher** than the listing price.", timestamp: "2d ago" },
      { id: "m_002_2", role: "ai", content: "Investigation complete. Root cause: **hidden fees not shown on listing**.\n\n- Listed price: $89/night average\n- Confirmation price: $127/night average (+42%)\n- Breakdown: Taxes $18 + Service fee $12 + Resort fee $8\n- Users who see the price jump are **3.8x more likely** to abandon\n\n12 of 15 interview respondents reported feeling deceived by the price difference.", timestamp: "2d ago" },
      { id: "m_002_3", role: "user", content: "What's the impact on revenue?", timestamp: "1d ago" },
      { id: "m_002_4", role: "ai", content: "From Amplitude data:\n\n- **~8,400 users/week** reach price confirmation\n- **~6,550** abandon when they see the final price\n- Average booking value: **$312**\n- Estimated weekly lost revenue: **$2.04M**\n\nCompetitors showing transparent pricing see **2.3x higher** booking completion. Generating recommendation.", timestamp: "1d ago" },
      { id: "m_002_5", role: "ai", content: "Recommendation generated.", timestamp: "12h ago", recommendation: { title: "Transparent Price Display", description: "Show total price including all taxes and fees on listing cards and search results. Add 'Price includes all fees' badge. Show fee breakdown on hover/tap.", estimatedImpact: "+41% booking completion, ~$4.3M quarterly revenue recovery", effort: "S" } },
    ],
  },
  {
    id: "ins_003",
    status: "resolved",
    title: "Mobile booking completion 2.3x lower than desktop",
    metric: "Mobile Conversion",
    source: "Amplitude + Sentry",
    detectedAt: "2d ago",
    topics: ["Mobile"],
    confidence: 76,
    interviewId: "iv_003",
    messages: [
      { id: "m_003_1", role: "ai", content: "**Anomaly detected:** Mobile booking completion rate is 1.4% vs desktop 3.2% — mobile users are **2.3x less likely** to complete a booking.", timestamp: "2d ago" },
      { id: "m_003_2", role: "ai", content: "Findings:\n\n- Book button below the fold on mobile (3 screens down past hotel photos)\n- Checkout form not optimized for mobile keyboards\n- Payment page takes **4.2s** to load on 4G (vs 0.8s on desktop)\n- 12% of mobile payment attempts result in Sentry errors\n\n7 of 10 interviewed users mentioned difficulty finding the Book button on mobile.\n\n**Insight resolved** — quantitative + qualitative integrated. Confidence: **76%**. Ready for recommendation.", timestamp: "1d ago" },
      { id: "m_003_3", role: "user", content: "What percentage of our traffic is mobile?", timestamp: "1d ago" },
      { id: "m_003_4", role: "ai", content: "From Amplitude:\n\n- **68% mobile** / 32% desktop\n- Mobile: 57,276 DAU, 1.4% booking rate → 802 bookings/day\n- Desktop: 26,954 DAU, 3.2% booking rate → 863 bookings/day\n\nMobile has **2.1x more users** but generates **fewer bookings** than desktop. Fixing mobile alone could add **~$1.8M/month** in bookings.", timestamp: "1d ago" },
    ],
  },
  {
    id: "ins_004",
    status: "investigating",
    title: "Saved-to-Booked conversion dropping 12% WoW",
    metric: "Save-to-Book Conversion",
    source: "Amplitude",
    detectedAt: "1d ago",
    topics: [],
    confidence: 61,
    interviewId: "iv_004",
    messages: [
      { id: "m_004_1", role: "ai", content: "**Anomaly detected:** Saved-to-Booked conversion rate dropped from 12.4% to 8.1% over 4 weeks — **12% week-over-week decline**. Users are saving more hotels (+24%) but booking fewer.", timestamp: "1d ago" },
      { id: "m_004_2", role: "ai", content: "Investigating. Initial findings:\n\n- Average saved hotels per user increased from 4.2 to 6.8\n- Time from Save to Book increased from 2.1 days to 4.7 days\n- Users with 10+ saved hotels have **lowest** booking rate (3.1%)\n- \"Choice paralysis\" pattern: more options → less action\n\nSent 15 interview requests — 5 returned so far. Confidence: **61%**.", timestamp: "12h ago" },
    ],
  },
  {
    id: "ins_005",
    status: "detected",
    title: "Search → Detail page CTR dropped 15% after UI update",
    metric: "Search CTR",
    source: "Amplitude",
    detectedAt: "2h ago",
    topics: [],
    confidence: 45,
    messages: [
      { id: "m_005_1", role: "ai", content: "**Anomaly detected:** Search results CTR dropped from 62.6% to 53.2% after the card layout update deployed 3 days ago. Hotel detail page views down 12%.\n\nStarting automated investigation — analyzing card click heatmaps, scroll depth, and A/B test holdout group.", timestamp: "2h ago" },
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
  { id: "feat_001", name: "One-tap Booking from Saved", description: "Add transparent-price Book CTA directly on Saved list cards with 2-step checkout via Apple Pay / Google Pay.", insightId: "ins_001", impactScore: 9.4, confidence: 94, effort: "M", status: "In Progress" },
  { id: "feat_002", name: "Transparent Price Display", description: "Show total price including all taxes and fees on search results and listing cards. Add fee breakdown on hover.", insightId: "ins_prev_001", impactScore: 8.8, confidence: 88, effort: "S", status: "Released" },
  { id: "feat_003", name: "Mobile Booking Redesign", description: "Mobile-first booking flow with sticky Book CTA, optimized form inputs, and faster payment page loading.", insightId: "ins_prev_002", impactScore: 8.2, confidence: 76, effort: "L", status: "In Progress" },
  { id: "feat_004", name: "Smart Price Alerts", description: "Notify users when saved hotel prices drop. Priority-based alerts with optimal send timing.", insightId: "ins_004", impactScore: 7.6, confidence: 61, effort: "M", status: "Proposed" },
  { id: "feat_005", name: "Search Result Cards v2", description: "Redesigned search result cards with larger photos, clearer pricing, and instant-save interaction.", insightId: "ins_005", impactScore: 7.1, confidence: 45, effort: "L", status: "Approved" },
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
  { id: "pr_001", number: 234, title: "feat: add book CTA to saved hotels list", branch: "feat/one-tap-booking", baseBranch: "main", featureName: "One-tap Booking from Saved", status: "open", additions: 542, deletions: 87, filesChanged: 12, createdAt: "1d ago", reviewStatus: "pending", author: "iterate-ai", authorAvatar: "IA" },
  { id: "pr_002", number: 231, title: "feat: show total price on hotel listing cards", branch: "feat/transparent-pricing", baseBranch: "main", featureName: "Transparent Price Display", status: "merged", additions: 234, deletions: 45, filesChanged: 8, createdAt: "5d ago", reviewStatus: "approved", author: "iterate-ai", authorAvatar: "IA" },
  { id: "pr_003", number: 229, title: "feat: fee breakdown tooltip component", branch: "feat/transparent-pricing", baseBranch: "main", featureName: "Transparent Price Display", status: "merged", additions: 189, deletions: 12, filesChanged: 5, createdAt: "7d ago", reviewStatus: "approved", author: "iterate-ai", authorAvatar: "IA" },
  { id: "pr_004", number: 236, title: "feat: mobile-first booking flow layout", branch: "feat/mobile-booking-v2", baseBranch: "main", featureName: "Mobile Booking Redesign", status: "open", additions: 678, deletions: 234, filesChanged: 18, createdAt: "6h ago", reviewStatus: "pending", author: "iterate-ai", authorAvatar: "IA" },
  { id: "pr_005", number: 237, title: "feat: Apple Pay / Google Pay checkout integration", branch: "feat/one-tap-booking", baseBranch: "main", featureName: "One-tap Booking from Saved", status: "draft", additions: 312, deletions: 28, filesChanged: 7, createdAt: "3h ago", reviewStatus: "none", author: "iterate-ai", authorAvatar: "IA" },
]

// ---------------------------------------------------------------------------
// Git Repository Context
// ---------------------------------------------------------------------------
export const repoInfo = {
  owner: "ahoda-inc",
  name: "ahoda-web",
  fullName: "ahoda-inc/ahoda-web",
  defaultBranch: "main",
  url: "https://github.com/ahoda-inc/ahoda-web",
  openPrs: 3,
  branches: 12,
  lastPush: "3h ago",
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
    id: "exp_001", name: "Transparent Pricing v1", featureName: "Transparent Price Display", branch: "feat/transparent-pricing", status: "completed", metric: "Booking Completion Rate", startedAt: "14d ago", significance: 97,
    variants: [{ name: "Control", users: 12400, metric: 22, change: 0 }, { name: "Transparent", users: 12380, metric: 31, change: 41 }],
  },
  {
    id: "exp_002", name: "One-tap Booking from Saved", featureName: "One-tap Booking from Saved", branch: "feat/one-tap-booking", status: "running", metric: "Saved-to-Booked Rate", startedAt: "2d ago", significance: 74,
    variants: [{ name: "Control", users: 3200, metric: 8.1, change: 0 }, { name: "One-tap", users: 3180, metric: 14.6, change: 80.2 }],
  },
  {
    id: "exp_003", name: "Mobile Booking Redesign", featureName: "Mobile Booking Redesign", branch: "feat/mobile-booking-v2", status: "running", metric: "Mobile Booking Rate", startedAt: "5d ago", significance: 68,
    variants: [{ name: "Control", users: 8400, metric: 1.4, change: 0 }, { name: "Redesigned", users: 8380, metric: 2.1, change: 50 }],
  },
  {
    id: "exp_004", name: "Smart Price Alerts", featureName: "Smart Price Alerts", branch: "feat/price-alerts", status: "paused", metric: "Save-to-Book Conversion", startedAt: "10d ago", significance: 52,
    variants: [{ name: "Control", users: 2100, metric: 8.1, change: 0 }, { name: "With Alerts", users: 2080, metric: 10.4, change: 28.4 }],
  },
]

// ---------------------------------------------------------------------------
// Dashboard: Activity Feed
// ---------------------------------------------------------------------------
export const recentActivity = [
  { type: "insight" as const, message: "AI detected: Book button CTR 10.6x lower than Save button", time: "1h ago" },
  { type: "suggestion" as const, message: "AI recommends: One-tap booking from Saved list", time: "1h ago" },
  { type: "pr" as const, message: "PR #234 generated: Add book CTA to saved hotels list", time: "3h ago" },
  { type: "experiment" as const, message: "Experiment started: One-tap Booking A/B test", time: "5h ago" },
  { type: "result" as const, message: "Transparent Pricing: +41% booking completion (97% significance)", time: "1d ago" },
  { type: "data" as const, message: "Imported 84.2k events from Amplitude", time: "1d ago" },
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
    title: "Booking conversion deep dive",
    updatedAt: "9:05 AM",
    preview: "Book button CTR is 3.2% vs Save at 34.1%. Three root causes...",
    messages: [
      {
        id: "msg_001",
        role: "assistant",
        content: "Good morning! Here's your daily product briefing:\n\n**Key highlights:**\n- DAU steady at 84,230 (+3.4%)\n- Book button CTR insight approved — 5 tasks created, PRs generating\n- Booking abandonment at price step (78%) recommendation ready for review\n\nWhat would you like to focus on today?",
        createdAt: "9:00 AM",
      },
      {
        id: "msg_002",
        role: "user",
        content: "Tell me more about the Book vs Save gap",
        createdAt: "9:02 AM",
      },
      {
        id: "msg_003",
        role: "assistant",
        content: "**Book Button vs Save Button — 10.6x CTR Gap**\n\nBook button CTR: 3.2% · Save button CTR: 34.1%\n\nThree root causes:\n1. No price shown on Book button — users don't trust it\n2. 6-step checkout (industry standard: 2-3)\n3. No booking from Saved list — 26.5k weekly savers can't convert\n\n**Action taken:** Feature \"One-tap Booking from Saved\" approved. 5 tasks created. PR #234 is open.\n\nWant me to show the experiment design?",
        createdAt: "9:02 AM",
      },
      {
        id: "msg_004",
        role: "user",
        content: "What's the expected revenue impact?",
        createdAt: "9:05 AM",
      },
      {
        id: "msg_005",
        role: "assistant",
        content: "Conservative estimate: **+$2.4M ARR**\n\nBreakdown:\n- 26,480 weekly savers × improved 14.6% conversion (from 8.1%)\n- Average booking: $312\n- Early A/B results show +80% saved-to-book rate at 74% significance\n- If transparent pricing experiment also ships (+41% booking completion), combined impact could reach **$6M+ ARR**\n\nThe one-tap booking experiment is already running on 50% of Saved list traffic.",
        createdAt: "9:05 AM",
      },
    ],
  },
  {
    id: "thread_002",
    title: "Price transparency strategy",
    updatedAt: "Yesterday",
    preview: "42% price increase from listing to confirmation is killing conversion...",
    messages: [
      {
        id: "msg_010",
        role: "user",
        content: "Why are users abandoning at price confirmation?",
        createdAt: "3:00 PM",
      },
      {
        id: "msg_011",
        role: "assistant",
        content: "Price shown on confirmation is **42% higher** than listing:\n\n- Listed: $89/night → Confirmation: $127/night\n- Hidden fees: Taxes $18 + Service $12 + Resort $8\n- 78% of users abandon at this step\n- Users call it \"bait and switch\" in interviews\n\nRecommendation ready: Show total price upfront on all cards. Estimated impact: +41% booking completion.\n\nThe transparent pricing experiment already completed with **97% significance** — +41% improvement confirmed.",
        createdAt: "3:01 PM",
      },
    ],
  },
  {
    id: "thread_003",
    title: "Mobile booking optimization",
    updatedAt: "Mar 6",
    preview: "68% of traffic is mobile but generates fewer bookings than desktop...",
    messages: [
      {
        id: "msg_020",
        role: "user",
        content: "How bad is mobile booking?",
        createdAt: "10:00 AM",
      },
      {
        id: "msg_021",
        role: "assistant",
        content: "**Mobile has 2.1x more users but fewer bookings than desktop.**\n\n- Mobile: 57,276 DAU → 1.4% booking rate → 802 bookings/day\n- Desktop: 26,954 DAU → 3.2% booking rate → 863 bookings/day\n\nKey issues:\n- Book button below 3 screens of photos\n- Payment page: 4.2s load on 4G\n- 12% of payment attempts error out (Sentry)\n\nMobile booking redesign PR #236 is open. A/B test running: 50% → 2.1% mobile rate at 68% significance.",
        createdAt: "10:01 AM",
      },
    ],
  },
]
