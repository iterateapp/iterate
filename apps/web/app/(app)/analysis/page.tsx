import { getLifecycleInsights, getFeatures, getUserInterviews } from "@/lib/queries"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { AnalysisClient } from "./analysis-client"

export default async function AnalysisPage() {
  const [lifecycleInsights, features, userInterviews] = await Promise.all([
    getLifecycleInsights(),
    getFeatures(),
    getUserInterviews(),
  ])

  return (
    <AnalysisClient
      lifecycleInsights={lifecycleInsights}
      features={features}
      userInterviews={userInterviews}
      iterationLoop={<IterationLoop currentHref="/analysis" />}
    />
  )
}
