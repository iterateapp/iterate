import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { Badge } from "@/components/ui/badge"
import { experiments, features, repoInfo, type ExperimentStatus } from "@/lib/mock-data"
import {
  BarChart3,
  TrendingUp,
  CornerDownLeft,
  GitBranch,
  ExternalLink,
  FlaskConical,
} from "lucide-react"

const statusBadge: Record<ExperimentStatus, string> = {
  running: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  completed: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
}

const releasedFeatures = features.filter(f => f.status === "Released")
const completedExperiments = experiments.filter(e => e.status === "completed")

const stats = [
  { label: "Active Experiments", value: String(experiments.filter(e => e.status === "running").length) },
  { label: "Completed", value: String(completedExperiments.length) },
  { label: "Significant Results", value: String(experiments.filter(e => e.significance >= 95).length) },
]

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/" />
      <main className="mx-auto max-w-[1200px] px-8 py-8">
        <IterationLoop currentHref="/results" />

        <div className="mt-8 mb-6 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
            <BarChart3 className="size-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Results</h1>
            <p className="text-sm text-muted-foreground">A/B test outcomes & impact measurement — results feed back to Data</p>
          </div>
        </div>

        {/* Repo context bar */}
        <div className="mb-6 flex items-center gap-4 rounded-lg border bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <FlaskConical className="size-3.5 text-muted-foreground" />
            <span className="font-medium">Experiments</span>
          </div>
          <div className="h-3.5 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GitBranch className="size-3" />
            <span className="font-mono text-[11px]">{repoInfo.fullName}</span>
          </div>
          <div className="h-3.5 w-px bg-border" />
          <span className="text-[11px] text-muted-foreground">{experiments.filter(e => e.status === "running").length} running on feature branches</span>
          <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
            <ExternalLink className="size-3" />
            GitHub
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

        {/* Loop-back callout */}
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-dashed border-amber-300/60 bg-amber-50/30 px-4 py-3 dark:border-amber-800/60 dark:bg-amber-950/20">
          <CornerDownLeft className="size-4 text-amber-500" />
          <p className="text-xs text-muted-foreground">
            Experiment results automatically feed back into <Link href="/data" className="font-medium text-foreground underline underline-offset-2">Data</Link> for the next iteration cycle.
          </p>
        </div>

        {/* ── Experiments ── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Experiments</h2>
          <div className="space-y-4">
            {experiments.map(exp => {
              const winner = exp.variants.reduce((a, b) => a.metric > b.metric ? a : b)
              return (
                <div key={exp.id} className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10 transition-all hover:ring-foreground/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{exp.name}</p>
                        <Badge variant="secondary" className={`text-[10px] ${statusBadge[exp.status]}`}>{exp.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{exp.featureName} · Started {exp.startedAt}</p>
                      <div className="mt-1.5 flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 w-fit">
                        <GitBranch className="size-2.5 text-muted-foreground" />
                        <span className="font-mono text-[10px] text-muted-foreground">{exp.branch}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Significance</p>
                      <p className={`text-lg font-semibold ${exp.significance >= 95 ? "text-emerald-600 dark:text-emerald-400" : exp.significance >= 80 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                        {exp.significance}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">{exp.metric}</p>
                    <div className="space-y-2">
                      {exp.variants.map(v => {
                        const isWinner = v === winner && v.change > 0
                        const maxMetric = Math.max(...exp.variants.map(x => x.metric))
                        const barWidth = maxMetric > 0 ? (v.metric / maxMetric) * 100 : 0
                        return (
                          <div key={v.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{v.name}</span>
                                <span className="text-muted-foreground">{v.users.toLocaleString()} users</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold">{v.metric}%</span>
                                {v.change > 0 && (
                                  <span className={`flex items-center gap-0.5 ${isWinner ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                                    <TrendingUp className="size-3" />
                                    +{v.change}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className={`h-2 rounded-full transition-all ${isWinner ? "bg-emerald-500 dark:bg-emerald-400" : v.change === 0 ? "bg-muted-foreground/30" : "bg-foreground/50"}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Released Features Impact ── */}
        {releasedFeatures.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Released Features</h2>
            <div className="space-y-3">
              {releasedFeatures.map(f => {
                const relatedExp = experiments.find(e => e.featureName === f.name && e.status === "completed")
                const winningVariant = relatedExp?.variants.reduce((a, b) => a.metric > b.metric ? a : b)
                return (
                  <div key={f.id} className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{f.name}</p>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Released</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
                        {relatedExp && (
                          <div className="mt-1.5 flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 w-fit">
                            <GitBranch className="size-2.5 text-muted-foreground" />
                            <span className="font-mono text-[10px] text-muted-foreground">{relatedExp.branch}</span>
                            <span className="text-[10px] text-muted-foreground/50">→ merged to main</span>
                          </div>
                        )}
                      </div>
                      {relatedExp && winningVariant && winningVariant.change > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{relatedExp.metric}</p>
                          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            +{winningVariant.change}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">{relatedExp.significance}% significance</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
