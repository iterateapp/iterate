import Link from "next/link"
import { getIterationSteps } from "@/lib/queries"
import { cn } from "@/lib/utils"
import {
  Database,
  Sparkles,
  Code,
  BarChart3,
  ArrowRight,
  RotateCcw,
} from "lucide-react"

type LoopStepStatus = "complete" | "active" | "pending"

const stepIcons = [Database, Sparkles, Code, BarChart3]

// Per-step color theme: 1=blue, 2=violet, 3=emerald, 4=amber
const stepColors = [
  { card: "border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10 dark:border-blue-400 dark:bg-blue-950/60", icon: "bg-blue-500 text-white dark:bg-blue-500", badge: "bg-blue-500 text-white", arrow: "text-blue-400 dark:text-blue-500" },
  { card: "border-violet-500 bg-violet-50 shadow-md shadow-violet-500/10 dark:border-violet-400 dark:bg-violet-950/60", icon: "bg-violet-500 text-white dark:bg-violet-500", badge: "bg-violet-500 text-white", arrow: "text-violet-400 dark:text-violet-500" },
  { card: "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10 dark:border-emerald-400 dark:bg-emerald-950/60", icon: "bg-emerald-500 text-white dark:bg-emerald-500", badge: "bg-emerald-500 text-white", arrow: "text-emerald-400 dark:text-emerald-500" },
  { card: "border-amber-500 bg-amber-50 shadow-md shadow-amber-500/10 dark:border-amber-400 dark:bg-amber-950/60", icon: "bg-amber-500 text-white dark:bg-amber-500", badge: "bg-amber-500 text-white", arrow: "text-amber-400 dark:text-amber-500" },
]

// What flows between steps
const connectorLabels = ["Signals", "Insights", "Features"]

const statusStyles: Record<LoopStepStatus, { card: string; icon: string; badge: string }> = {
  complete: {
    card: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800",
    icon: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  },
  active: {
    card: "border-violet-300 bg-violet-50/60 ring-2 ring-violet-500/20 dark:border-violet-700 dark:bg-violet-950/40 dark:ring-violet-400/20 hover:ring-violet-500/30",
    icon: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },
  pending: {
    card: "border-border bg-card hover:border-foreground/20",
    icon: "text-muted-foreground bg-muted",
    badge: "bg-muted text-muted-foreground",
  },
}

export async function IterationLoop({ currentHref }: { currentHref?: string } = {}) {
  const iterationSteps = await getIterationSteps()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Iteration Loop</h2>
          <p className="text-sm text-muted-foreground">Click any step to view details</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RotateCcw className="size-3.5" />
          Cycle #4
        </div>
      </div>

      {/* Steps with flow connectors */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-0">
        {iterationSteps.map((step, i) => {
          const Icon = stepIcons[i]
          const styles = statusStyles[step.status]
          const isCurrent = currentHref === step.href
          return (
            <div key={step.label} className="flex flex-1 items-stretch">
              <Link
                href={step.href}
                className={cn(
                  "group flex-1 rounded-xl border p-4 transition-all hover:shadow-sm",
                  isCurrent
                    ? stepColors[i].card
                    : currentHref
                      ? "border-border bg-card opacity-50 hover:opacity-75"
                      : styles.card,
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    isCurrent ? stepColors[i].icon : styles.icon
                  )}>
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex h-4 items-center rounded px-1 text-[10px] font-bold",
                        isCurrent ? stepColors[i].badge : styles.badge
                      )}>
                        {i + 1}
                      </span>
                      <p className="text-sm font-semibold">{step.label}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{step.sublabel}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{step.description}</p>
                <div className="mt-3 border-t pt-2.5">
                  <p className="text-[11px] font-medium text-muted-foreground">{step.detail}</p>
                </div>
              </Link>

              {/* Flow connector */}
              {i < iterationSteps.length - 1 && (
                <div className="hidden shrink-0 flex-col items-center justify-center gap-0.5 px-1.5 lg:flex">
                  <ArrowRight className={cn("size-4", isCurrent ? stepColors[i].arrow : "text-muted-foreground/30")} />
                  <span className="text-[9px] font-medium text-muted-foreground/50">{connectorLabels[i]}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Loop-back arrow: Step 4 → Step 1 */}
      {(() => {
        const isStep4 = currentHref === iterationSteps[3]?.href
        return (
          <div className="relative hidden h-7 lg:block mx-[60px]">
            {/* U-shaped line */}
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              fill="none"
            >
              <defs>
                <linearGradient id="loopGrad" x1="100%" y1="0" x2="0%" y2="0">
                  <stop offset="0%" stopColor={isStep4 ? "rgb(245 158 11)" : "rgb(168 162 158)"} stopOpacity={isStep4 ? "0.45" : "0.15"} />
                  <stop offset="50%" stopColor="rgb(168 162 158)" stopOpacity={isStep4 ? "0.2" : "0.1"} />
                  <stop offset="100%" stopColor={isStep4 ? "rgb(59 130 246)" : "rgb(168 162 158)"} stopOpacity={isStep4 ? "0.45" : "0.15"} />
                </linearGradient>
              </defs>
              <path
                d="M 97 0 L 97 14 Q 97 18 93 18 L 7 18 Q 3 18 3 14 L 3 2"
                stroke="url(#loopGrad)"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {/* Arrowhead */}
            <svg
              className="absolute -top-[5px] left-[3%] -translate-x-1/2 overflow-visible"
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
            >
              <path d="M5 0L9 7H1L5 0Z" fill={isStep4 ? "rgb(59 130 246)" : "rgb(168 162 158)"} fillOpacity={isStep4 ? "0.5" : "0.15"} />
            </svg>
            {/* Label */}
            <span className="absolute left-1/2 top-[10px] -translate-x-1/2 text-[9px] font-medium text-muted-foreground/50">
              Results
            </span>
          </div>
        )
      })()}
    </div>
  )
}
