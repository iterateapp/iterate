import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { iterationSteps } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { ArrowRight, RefreshCw } from "lucide-react"

export function IterationLoop() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RefreshCw className="size-4 text-muted-foreground" />
          <CardTitle>Iteration Loop</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-0">
          {iterationSteps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div
                className={cn(
                  "flex flex-col items-center rounded-lg border px-3 py-2.5 text-center transition-colors sm:px-4",
                  step.active
                    ? "border-violet-500/50 bg-violet-50 dark:border-violet-400/30 dark:bg-violet-950"
                    : "border-transparent bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium sm:text-sm",
                    step.active
                      ? "text-violet-700 dark:text-violet-300"
                      : "text-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-muted-foreground sm:text-xs">
                  {step.description}
                </span>
              </div>
              {i < iterationSteps.length - 1 && (
                <ArrowRight className="mx-1 hidden size-3.5 shrink-0 text-muted-foreground sm:block" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
