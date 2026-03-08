import { Header } from "@/components/dashboard/header"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { keyMetrics } from "@/lib/mock-data"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus }
const trendColor = { up: "text-emerald-600 dark:text-emerald-400", down: "text-red-500", stable: "text-muted-foreground" }

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/" />
      <main className="mx-auto max-w-[1200px] space-y-8 px-8 py-8">
        <IterationLoop />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

        <ActivityFeed />
      </main>
    </div>
  )
}
