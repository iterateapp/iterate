import { Header } from "@/components/dashboard/header"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { Badge } from "@/components/ui/badge"
import { features, pullRequests, type FeatureStatus, type PrStatus } from "@/lib/mock-data"
import {
  Code,
  GitMerge,
  CircleDot,
  FileEdit,
  Check,
  Clock,
  MessageSquare,
} from "lucide-react"

const featureStatusColor: Record<FeatureStatus, string> = {
  Proposed: "bg-secondary text-secondary-foreground",
  Approved: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Released: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
}

const prStatusIcon: Record<PrStatus, typeof GitMerge> = { merged: GitMerge, open: CircleDot, draft: FileEdit }
const prStatusColor: Record<PrStatus, string> = { merged: "text-violet-500", open: "text-emerald-500", draft: "text-muted-foreground" }
const prBadgeColor: Record<PrStatus, string> = {
  merged: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  open: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  draft: "bg-secondary text-secondary-foreground",
}

const reviewIcon: Record<string, { icon: typeof Check; color: string }> = {
  approved: { icon: Check, color: "text-emerald-500" },
  changes_requested: { icon: MessageSquare, color: "text-amber-500" },
  pending: { icon: Clock, color: "text-muted-foreground" },
  none: { icon: Clock, color: "opacity-0" },
}

const effortLabel: Record<string, string> = { S: "Small", M: "Medium", L: "Large", XL: "Extra Large" }

const stats = [
  { label: "Features", value: String(features.length) },
  { label: "In Progress", value: String(features.filter(f => f.status === "In Progress").length) },
  { label: "Open PRs", value: String(pullRequests.filter(p => p.status === "open" || p.status === "draft").length) },
]

export default function DevelopmentPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/" />
      <main className="mx-auto max-w-[1200px] px-8 py-8">
        <IterationLoop currentHref="/development" />

        <div className="mt-8 mb-8 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
            <Code className="size-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Development</h1>
            <p className="text-sm text-muted-foreground">Feature proposals & AI-generated pull requests</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Features</h2>
          <div className="space-y-3">
            {features.map(f => (
              <div key={f.id} className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10 transition-all hover:ring-foreground/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{f.name}</p>
                      <Badge variant="secondary" className={featureStatusColor[f.status]}>{f.status}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.description}</p>
                  </div>
                  <div className="flex shrink-0 gap-5 text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Impact</p>
                      <p className="text-lg font-semibold">{f.impactScore}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p>
                      <p className="text-lg font-semibold">{f.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Effort</p>
                      <p className="text-lg font-semibold">{f.effort}</p>
                      <p className="text-[10px] text-muted-foreground">{effortLabel[f.effort]}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pull Requests ── */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pull Requests</h2>
          <div className="overflow-hidden rounded-xl border ring-1 ring-foreground/10">
            {pullRequests.map((pr, i) => {
              const Icon = prStatusIcon[pr.status]
              const review = reviewIcon[pr.reviewStatus]
              const ReviewIcon = review.icon
              return (
                <div key={pr.id} className={`flex items-center gap-4 bg-card px-5 py-4 transition-colors hover:bg-muted/30 ${i > 0 ? "border-t" : ""}`}>
                  <Icon className={`size-5 shrink-0 ${prStatusColor[pr.status]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{pr.title}</p>
                      <Badge variant="secondary" className={`shrink-0 text-[10px] ${prBadgeColor[pr.status]}`}>{pr.status}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>#{pr.number}</span>
                      <span>{pr.featureName}</span>
                      <span>{pr.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    {pr.reviewStatus !== "none" && <ReviewIcon className={`size-3.5 ${review.color}`} />}
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400">+{pr.additions}</span>
                      <span className="text-red-500">-{pr.deletions}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{pr.filesChanged} files</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
