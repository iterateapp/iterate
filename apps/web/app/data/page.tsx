import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  keyMetrics,
  topEvents,
  funnelData,
  interviews,
  supportThemes,
  npsData,
  dataSources,
  type Sentiment,
} from "@/lib/mock-data"
import {
  Database,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  MessageSquare,
  ArrowDown,
  Settings,
  Check,
  Plug,
  RefreshCw,
} from "lucide-react"

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus }
const trendColor = { up: "text-emerald-600 dark:text-emerald-400", down: "text-red-500", stable: "text-muted-foreground" }
const sentimentColor: Record<Sentiment, string> = {
  positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  negative: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  mixed: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
}

export default function DataPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/" />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <IterationLoop currentHref="/data" />

        <div className="mt-8 mb-8 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <Database className="size-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Data</h1>
            <p className="text-sm text-muted-foreground">Quantitative metrics & qualitative user signals</p>
          </div>
        </div>

        {/* ── Connected Sources ── */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plug className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Connected Sources</h2>
            </div>
            <Link href="/data-sources" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <Settings className="size-3" />
              Manage
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {dataSources.map(ds => (
              <div
                key={ds.name}
                className={`rounded-xl border bg-card p-4 ring-1 ring-foreground/10 ${ds.status === "disconnected" ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Image src={ds.logoSrc} alt={ds.name} width={32} height={32} className="rounded-md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{ds.name}</p>
                      {ds.status === "connected" ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{ds.description}</p>
                  </div>
                </div>
                {ds.status === "connected" ? (
                  <div className="mt-3 space-y-1 border-t pt-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Events ingested</span>
                      <span className="font-medium">{ds.eventsIngested}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Error rate</span>
                      <span className="font-medium">{ds.errorRate}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <RefreshCw className="size-2.5" />
                      Synced {ds.lastSync}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 border-t pt-2.5">
                    <p className="text-[11px] text-muted-foreground">Not connected</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Quantitative ── */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quantitative</h2>
          </div>

          {/* Metrics */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {keyMetrics.map(m => {
              const Icon = trendIcon[m.trend]
              return (
                <div key={m.name} className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
                  <p className="text-xs text-muted-foreground">{m.name}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{m.value}</p>
                  <div className={`mt-1 flex items-center gap-1 text-xs ${trendColor[m.trend]}`}>
                    <Icon className="size-3" />
                    {m.change}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Two column: Events + Funnel */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Events */}
            <div className="rounded-xl border bg-card ring-1 ring-foreground/10">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">Top Events</p>
                <p className="text-xs text-muted-foreground">Last 7 days from Amplitude</p>
              </div>
              <div className="divide-y">
                {topEvents.map(ev => (
                  <div key={ev.name} className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-mono text-xs">{ev.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{ev.count.toLocaleString()}</span>
                      <span className={`text-xs ${ev.change.startsWith("+") ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {ev.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel */}
            <div className="rounded-xl border bg-card ring-1 ring-foreground/10">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">Activation Funnel</p>
                <p className="text-xs text-muted-foreground">User journey conversion</p>
              </div>
              <div className="p-4 space-y-2">
                {funnelData.map((step, i) => (
                  <div key={step.step}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>{step.step}</span>
                      <span className="font-medium">{step.users.toLocaleString()} <span className="text-muted-foreground">({step.rate}%)</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-blue-500/70 transition-all"
                        style={{ width: `${step.rate}%` }}
                      />
                    </div>
                    {i < funnelData.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown className="size-3 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Qualitative ── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Qualitative</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Interviews */}
            <div>
              <p className="mb-3 text-sm font-medium">User Interviews</p>
              <div className="space-y-3">
                {interviews.map((iv, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
                    <p className="text-sm italic leading-relaxed text-foreground/80">&ldquo;{iv.quote}&rdquo;</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{iv.user}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{iv.date}</span>
                      <Badge variant="secondary" className={`text-[10px] ${sentimentColor[iv.sentiment]}`}>
                        {iv.sentiment}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{iv.topic}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support + NPS */}
            <div className="space-y-6">
              {/* Support Themes */}
              <div className="rounded-xl border bg-card ring-1 ring-foreground/10">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-medium">Support Themes</p>
                </div>
                <div className="divide-y">
                  {supportThemes.map(t => {
                    const Icon = trendIcon[t.trend]
                    return (
                      <div key={t.theme} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs">{t.theme}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{t.tickets}</span>
                          <Icon className={`size-3 ${trendColor[t.trend]}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* NPS */}
              <div className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
                <p className="text-sm font-medium">NPS Score</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-bold tracking-tight">{npsData.score}</span>
                  <span className="mb-1 text-sm text-emerald-600 dark:text-emerald-400">+{npsData.score - npsData.previousScore} vs last month</span>
                </div>
                <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
                  <div className="bg-emerald-500" style={{ width: `${npsData.promoters}%` }} />
                  <div className="bg-amber-400" style={{ width: `${npsData.passives}%` }} />
                  <div className="bg-red-400" style={{ width: `${npsData.detractors}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>Promoters {npsData.promoters}%</span>
                  <span>Passives {npsData.passives}%</span>
                  <span>Detractors {npsData.detractors}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
