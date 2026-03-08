import { Header } from "@/components/dashboard/header"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { AiInsightPanel } from "@/components/dashboard/ai-insight-panel"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { SuggestedFeatures } from "@/components/dashboard/suggested-features"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { CtaSection } from "@/components/dashboard/cta-section"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <KpiCards />
        <AiInsightPanel />
        <IterationLoop />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <SuggestedFeatures />
          <ActivityFeed />
        </div>
        <CtaSection />
      </main>
    </div>
  )
}
