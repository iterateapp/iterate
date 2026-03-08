import Link from "next/link"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { Badge } from "@/components/ui/badge"
import { getFeatures, getExperiments, getGitHubData, type FeatureStatus, type PrStatus } from "@/lib/queries"
import Image from "next/image"
import {
  Code,
  GitMerge,
  CircleDot,
  FileEdit,
  Check,
  Clock,
  MessageSquare,
  GitBranch,
  GitPullRequest,
  BarChart3,
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

export default async function DevelopmentPage() {
  const [features, experiments, githubData] = await Promise.all([
    getFeatures(),
    getExperiments(),
    getGitHubData(),
  ])

  const { repoInfo, pullRequests } = githubData

  const stats = [
    { label: "Features", value: String(features.length) },
    { label: "In Progress", value: String(features.filter(f => f.status === "In Progress").length) },
    { label: "Open PRs", value: String(pullRequests.filter(p => p.status === "open" || p.status === "draft").length) },
  ]

  const featureBranches: Record<string, string[]> = {}
  for (const pr of pullRequests) {
    if (!featureBranches[pr.featureName]) featureBranches[pr.featureName] = []
    if (!featureBranches[pr.featureName].includes(pr.branch)) {
      featureBranches[pr.featureName].push(pr.branch)
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-8">
        <IterationLoop currentHref="/development" />

        <div className="mt-8 mb-6 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
            <Code className="size-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Development</h1>
            <p className="text-sm text-muted-foreground">Feature proposals & AI-generated pull requests</p>
          </div>
        </div>

        {/* Repo context bar */}
        {repoInfo && (
          <div className="mb-6 flex items-center gap-4 rounded-lg border bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <GitBranch className="size-3.5 text-muted-foreground" />
              <span className="font-mono text-[11px] font-medium">{repoInfo.fullName}</span>
            </div>
            <div className="h-3.5 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GitPullRequest className="size-3" />
              <span>{repoInfo.openPrs} open</span>
            </div>
            <div className="h-3.5 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GitBranch className="size-3" />
              <span>{repoInfo.branches} branches</span>
            </div>
            <div className="h-3.5 w-px bg-border" />
            <span className="text-[11px] text-muted-foreground">Last push {repoInfo.lastPush}</span>
            <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
              <Image src="/logos/github.svg" alt="GitHub" width={14} height={14} className="dark:invert" />
              GitHub
            </div>
          </div>
        )}

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
            {features.map(f => {
              const branches = featureBranches[f.name] || []
              const linkedExp = experiments.find(e => e.featureName === f.name)
              return (
                <div key={f.id} className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10 transition-all hover:ring-foreground/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{f.name}</p>
                        <Badge variant="secondary" className={featureStatusColor[f.status]}>{f.status}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.description}</p>
                      {branches.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {branches.map(b => (
                            <div key={b} className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                              <GitBranch className="size-2.5 text-muted-foreground" />
                              <span className="font-mono text-[10px] text-muted-foreground">{b}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {linkedExp && (
                        <Link href="/results" className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900">
                          <BarChart3 className="size-2.5" />
                          <span>→ Experiment {linkedExp.status}: {linkedExp.significance}% sig</span>
                        </Link>
                      )}
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
              )
            })}
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
                <div key={pr.id} className={`bg-card px-5 py-4 transition-colors hover:bg-muted/30 ${i > 0 ? "border-t" : ""}`}>
                  <div className="flex items-center gap-4">
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
                        <span className="text-[10px]">by {pr.author}</span>
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
                  <div className="mt-2 flex items-center gap-2 pl-9">
                    <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                      <GitBranch className="size-2.5 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">{pr.branch}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50">→</span>
                    <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                      <GitBranch className="size-2.5 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">{pr.baseBranch}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
    </div>
  )
}
