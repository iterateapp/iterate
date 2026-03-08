import { Card, CardContent } from "@/components/ui/card"
import { kpiData } from "@/lib/mock-data"
import { Activity, Lightbulb, Code, BarChart3 } from "lucide-react"

const icons = [Activity, Lightbulb, Code, BarChart3]

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, i) => {
        const Icon = icons[i]
        return (
          <Card key={kpi.title}>
            <CardContent className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {kpi.title}
                </p>
                <p className="text-2xl font-semibold tracking-tight">
                  {kpi.value}
                </p>
                <p className="text-xs text-muted-foreground">{kpi.change}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <Icon className="size-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
