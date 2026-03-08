export const kpiData = [
  {
    title: "Active Experiments",
    value: "12",
    change: "+3 this week",
    trend: "up" as const,
  },
  {
    title: "AI Suggested Features",
    value: "28",
    change: "+5 new proposals",
    trend: "up" as const,
  },
  {
    title: "Features In Development",
    value: "7",
    change: "2 shipping soon",
    trend: "neutral" as const,
  },
  {
    title: "Recent Product Insights",
    value: "43",
    change: "+12 this week",
    trend: "up" as const,
  },
]

export const topInsight = {
  problem: "Users struggle to discover creators relevant to their interests",
  evidence:
    "Interview feedback from 23 users and analytics data showing 68% drop-off on discovery page. Average session time on discovery is 14s vs 3.2min on curated feeds.",
  recommendedFeature: "Creator Discovery Feed",
  impactScore: 9.1,
  confidence: 86,
}

export const iterationSteps = [
  { label: "User Data", description: "Collect signals", active: false },
  { label: "AI Insight", description: "Analyze patterns", active: true },
  { label: "Feature Decision", description: "Prioritize", active: false },
  { label: "Tasks", description: "Generate work", active: false },
  { label: "PR", description: "Code changes", active: false },
  { label: "Deploy", description: "Ship to prod", active: false },
  { label: "Experiment", description: "Run A/B test", active: false },
]

export type FeatureStatus = "Proposed" | "Approved" | "In Progress"

export const suggestedFeatures = [
  {
    name: "Creator Discovery Feed",
    impactScore: 9.1,
    confidence: 86,
    status: "Proposed" as FeatureStatus,
  },
  {
    name: "Smart Notification Batching",
    impactScore: 8.4,
    confidence: 79,
    status: "Approved" as FeatureStatus,
  },
  {
    name: "Onboarding Personalization",
    impactScore: 8.1,
    confidence: 91,
    status: "In Progress" as FeatureStatus,
  },
  {
    name: "Collaborative Workspaces",
    impactScore: 7.8,
    confidence: 72,
    status: "Proposed" as FeatureStatus,
  },
  {
    name: "AI Writing Assistant",
    impactScore: 7.5,
    confidence: 68,
    status: "Proposed" as FeatureStatus,
  },
]

export const recentActivity = [
  {
    type: "insight" as const,
    message: "AI generated a new feature proposal: Creator Discovery Feed",
    time: "2 minutes ago",
  },
  {
    type: "tasks" as const,
    message: "12 tasks created for Smart Notification Batching",
    time: "1 hour ago",
  },
  {
    type: "pr" as const,
    message: "PR #142 generated: Implement onboarding flow v2",
    time: "3 hours ago",
  },
  {
    type: "experiment" as const,
    message: "Experiment started: Personalized onboarding (A/B test)",
    time: "5 hours ago",
  },
  {
    type: "result" as const,
    message: "Experiment result: Search improvements +14% engagement",
    time: "1 day ago",
  },
]
