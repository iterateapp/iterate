// ---------------------------------------------------------------------------
// UI-only configuration: status colors, icons, provider mappings, etc.
// These are display constants — not stored in the database.
// ---------------------------------------------------------------------------

// Insight lifecycle UI
export type UIInsightStatus = "detected" | "investigating" | "resolved" | "recommendation" | "approved" | "in_development"

export const insightStatusConfig: Record<UIInsightStatus, { label: string; color: string }> = {
  detected: { label: "Detected", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  investigating: { label: "Investigating", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  resolved: { label: "Resolved", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  recommendation: { label: "Recommendation", color: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  in_development: { label: "In Development", color: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" },
}

export const insightStatusOrder: UIInsightStatus[] = ["detected", "investigating", "resolved", "recommendation", "approved", "in_development"]

// Interview status UI
export type UIInterviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED"

export const userInterviewStatusConfig: Record<UIInterviewStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  EXPIRED: { label: "Expired", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

// Sentiment colors
export type Sentiment = "positive" | "negative" | "mixed" | "neutral"

// Provider to logo mapping
export const providerLogos: Record<string, string> = {
  amplitude: "/logos/amplitude.svg",
  mixpanel: "/logos/mixpanel.svg",
  sentry: "/logos/sentry.svg",
  slack: "/logos/slack.svg",
  crustdata: "/logos/crustdata.svg",
  linear: "/logos/linear.svg",
  github: "/logos/github.svg",
  notion: "/logos/notion.svg",
  zendesk: "/logos/zendesk.svg",
}

// Provider descriptions
export const providerDescriptions: Record<string, string> = {
  amplitude: "Product analytics",
  mixpanel: "Product analytics",
  sentry: "Error monitoring",
  slack: "User feedback",
  crustdata: "B2B data intelligence",
  linear: "Project management",
  github: "Code hosting",
  notion: "Documentation",
  zendesk: "Support tickets",
}

