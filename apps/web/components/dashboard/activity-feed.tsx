import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRecentActivity } from "@/lib/queries"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  MessageSquare,
  GitPullRequest,
  FlaskConical,
  BarChart3,
  Database,
  Clock,
} from "lucide-react"

const activityIcons = {
  insight: Sparkles,
  suggestion: MessageSquare,
  pr: GitPullRequest,
  experiment: FlaskConical,
  result: BarChart3,
  data: Database,
}

const activityColors = {
  insight: "text-violet-500",
  suggestion: "text-amber-500",
  pr: "text-emerald-500",
  experiment: "text-sky-500",
  result: "text-teal-500",
  data: "text-blue-500",
}

export async function ActivityFeed() {
  const recentActivity = await getRecentActivity()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((activity, i) => {
            const Icon = activityIcons[activity.type]
            return (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 rounded-md bg-muted p-1.5",
                    activityColors[activity.type]
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
