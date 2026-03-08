import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { topInsight } from "@/lib/mock-data"
import { Sparkles, ArrowRight } from "lucide-react"

export function AiInsightPanel() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-500" />
          <CardTitle>Top AI Insight</CardTitle>
        </div>
        <CardDescription>
          Highest-impact recommendation from the latest analysis cycle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Problem
              </p>
              <p className="mt-1 text-sm">{topInsight.problem}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Evidence
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {topInsight.evidence}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recommended Feature
              </p>
              <p className="mt-1 text-base font-semibold">
                {topInsight.recommendedFeature}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Impact Score
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-semibold">
                    {topInsight.impactScore}
                  </span>
                  <Badge variant="secondary">/10</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Confidence
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-semibold">
                    {topInsight.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button>
            Generate Tasks
            <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
