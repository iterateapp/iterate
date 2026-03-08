import Link from "next/link"
import { iterationSteps, type LoopStepStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import {
  Database,
  Sparkles,
  Code,
  BarChart3,
  ChevronRight,
  RotateCcw,
} from "lucide-react"

const stepIcons = [Database, Sparkles, Code, BarChart3]

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

export function IterationLoop({ currentHref }: { currentHref?: string } = {}) {
  return (
    <div className="space-y-3">
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

      {/* Steps with connectors */}
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
                  styles.card,
                  isCurrent && "ring-2 ring-foreground/30 shadow-sm"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", styles.icon)}>
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex h-4 items-center rounded px-1 text-[10px] font-bold", styles.badge)}>
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

              {/* Arrow connector */}
              {i < iterationSteps.length - 1 && (
                <div className="hidden shrink-0 lg:flex lg:items-center lg:px-2">
                  <ChevronRight className="size-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Loop-back: 4 → 1 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-1.5 rounded-full border px-3 py-1">
          <RotateCcw className="size-3" />
          <span>
            <span className="font-medium text-foreground">4</span> Results → <span className="font-medium text-foreground">1</span> Data
          </span>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}
