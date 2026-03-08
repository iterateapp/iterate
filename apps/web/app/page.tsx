import Image from "next/image"
import Link from "next/link"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { getDataSources, getAnalyticsData } from "@/lib/queries"
import { TrendingUp, TrendingDown, Minus, Check, Plug } from "lucide-react"

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus }
const trendColor = { up: "text-emerald-600 dark:text-emerald-400", down: "text-red-500", stable: "text-muted-foreground" }

export default async function DashboardPage() {
  const [dataSources, analytics] = await Promise.all([
    getDataSources(),
    getAnalyticsData(),
  ])

  return (
    <div className="mx-auto max-w-[960px] space-y-8 px-8 py-8">
      <IterationLoop />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {analytics.metrics.map(m => {
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

      {/* Connected Sources */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plug className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Connected Sources</h2>
          </div>
          <Link href="/data-sources" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Manage
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {dataSources.map(ds => (
            <div
              key={ds.id}
              className={`flex items-center gap-3 rounded-xl border bg-card p-3 ring-1 ring-foreground/10 ${ds.status === "disconnected" ? "opacity-40" : ""}`}
            >
              <Image src={ds.logoSrc} alt={ds.name} width={28} height={28} className="rounded-md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{ds.name}</p>
                  {ds.status === "connected" && <Check className="size-3 text-emerald-500" />}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {ds.status === "connected" ? `Synced ${ds.lastSync}` : "Not connected"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ActivityFeed />
    </div>
  )
}
