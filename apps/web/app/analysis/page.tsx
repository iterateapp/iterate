"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  lifecycleInsights,
  insightStatusConfig,
  insightStatusOrder,
  features,
  type InsightStatus,
  type InsightMessage,
} from "@/lib/mock-data"
import {
  Sparkles,
  Send,
  User,
  Check,
  FileText,
  ListChecks,
  MessageSquare,
  Shield,
  Clock,
  Code,
} from "lucide-react"
import { cn } from "@/lib/utils"

const statusSteps: { key: InsightStatus; short: string }[] = [
  { key: "detected", short: "Detected" },
  { key: "investigating", short: "Investigating" },
  { key: "resolved", short: "Resolved" },
  { key: "recommendation", short: "Rec" },
  { key: "approved", short: "Approved" },
  { key: "in_development", short: "Dev" },
]

function LifecycleProgress({ status }: { status: InsightStatus }) {
  const currentIdx = insightStatusOrder.indexOf(status)
  return (
    <div className="flex items-center gap-0.5">
      {statusSteps.map((step, i) => {
        const isCompleted = i < currentIdx
        const isCurrent = i === currentIdx
        return (
          <div key={step.key} className="flex items-center gap-0.5">
            <div
              className={cn(
                "size-1.5 rounded-full transition-colors",
                isCompleted && "bg-emerald-500",
                isCurrent && "bg-violet-500",
                !isCompleted && !isCurrent && "bg-muted-foreground/20"
              )}
            />
            {i < statusSteps.length - 1 && (
              <div className={cn("h-px w-2", i < currentIdx ? "bg-emerald-500/40" : "bg-muted-foreground/10")} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("> ")) {
      return (
        <blockquote key={i} className="my-1.5 border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground italic">
          {renderInline(line.slice(2))}
        </blockquote>
      )
    }
    if (line === "") return <br key={i} />
    return <p key={i} className="mb-1 last:mb-0">{renderInline(line)}</p>
  })
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function RecommendationCard({ rec, status }: { rec: NonNullable<InsightMessage["recommendation"]>; status: InsightStatus }) {
  const isApproved = insightStatusOrder.indexOf(status) >= insightStatusOrder.indexOf("approved")
  return (
    <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/50 p-3.5 dark:border-violet-800 dark:bg-violet-950/30">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="size-3 text-violet-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Recommendation</span>
      </div>
      <p className="text-sm font-medium">{rec.title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{rec.description}</p>
      <div className="mt-3 flex items-center gap-4 text-[11px]">
        <span className="text-muted-foreground">Impact: <span className="font-medium text-foreground">{rec.estimatedImpact}</span></span>
        <span className="text-muted-foreground">Effort: <span className="font-medium text-foreground">{rec.effort}</span></span>
      </div>
      {isApproved ? (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="size-3.5" />
          <span className="font-medium">Approved</span>
        </div>
      ) : status === "recommendation" ? (
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" className="h-7 text-xs">
            Approve
            <Check className="ml-1 size-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs">
            Need More Data
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default function AnalysisPage() {
  const [selectedId, setSelectedId] = useState(lifecycleInsights[1].id)
  const selected = lifecycleInsights.find(i => i.id === selectedId)!

  const statusConfig = insightStatusConfig[selected.status]
  const pipelineCounts = insightStatusOrder.reduce((acc, s) => {
    acc[s] = lifecycleInsights.filter(i => i.status === s).length
    return acc
  }, {} as Record<InsightStatus, number>)

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/" />
      <main className="mx-auto max-w-[1200px] px-8 py-8">
        <IterationLoop currentHref="/analysis" />

        <div className="mt-8 mb-6 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
            <Sparkles className="size-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Analysis</h1>
            <p className="text-sm text-muted-foreground">Insight lifecycle — detect, investigate, resolve, ship</p>
          </div>
        </div>

        {/* Pipeline overview */}
        <div className="mb-6 flex items-center gap-1.5">
          {insightStatusOrder.map(s => {
            const count = pipelineCounts[s]
            if (count === 0) return null
            const config = insightStatusConfig[s]
            return (
              <Badge key={s} variant="secondary" className={`text-[10px] ${config.color}`}>
                {count} {config.label}
              </Badge>
            )
          })}
          <span className="ml-auto text-xs text-muted-foreground">{lifecycleInsights.length} total insights</span>
        </div>

        {/* Split panel */}
        <div className="grid gap-0 overflow-hidden rounded-xl border ring-1 ring-foreground/10 lg:grid-cols-[340px_1fr]">
          {/* ── Left: Insight list ── */}
          <div className="border-r bg-muted/30">
            <div className="border-b px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Insights</p>
            </div>
            <div className="divide-y">
              {lifecycleInsights.map(insight => {
                const isSelected = insight.id === selectedId
                const config = insightStatusConfig[insight.status]
                const linkedFeature = features.find(f => f.insightId === insight.id)
                const showFeatureLink = linkedFeature && (insight.status === "approved" || insight.status === "in_development")
                return (
                  <button
                    key={insight.id}
                    onClick={() => setSelectedId(insight.id)}
                    className={cn(
                      "w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/50",
                      isSelected && "bg-background shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-medium leading-snug", isSelected ? "text-foreground" : "text-foreground/80")}>
                          {insight.title}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary" className={`text-[9px] ${config.color}`}>
                            {config.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{insight.detectedAt}</span>
                        </div>
                        <div className="mt-2">
                          <LifecycleProgress status={insight.status} />
                        </div>
                        {showFeatureLink && (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            <Code className="size-2" />
                            → Feature: {linkedFeature.name}
                          </div>
                        )}
                      </div>
                      {insight.confidence && (
                        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Shield className="size-2.5" />
                          {insight.confidence}%
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Right: Detail + Chat thread ── */}
          <div className="flex flex-col bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{selected.title}</p>
                  <Badge variant="secondary" className={`text-[10px] ${statusConfig.color}`}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{selected.source}</span>
                  <span>{selected.metric}</span>
                  <span>{selected.detectedAt}</span>
                  {selected.confidence && (
                    <span className="flex items-center gap-0.5">
                      <Shield className="size-2.5" />
                      {selected.confidence}% confidence
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {selected.interviewsSent && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MessageSquare className="size-3" />
                    {selected.interviewsResponded}/{selected.interviewsSent} interviews
                  </div>
                )}
                {selected.prdGenerated && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <FileText className="size-3" />
                    PRD
                  </div>
                )}
                {selected.taskCount && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <ListChecks className="size-3" />
                    {selected.taskCount} tasks
                  </div>
                )}
              </div>
            </div>

            {/* Lifecycle progress bar */}
            <div className="flex items-center gap-1 border-b px-5 py-2.5">
              {statusSteps.map((step, i) => {
                const currentIdx = insightStatusOrder.indexOf(selected.status)
                const isCompleted = i < currentIdx
                const isCurrent = i === currentIdx
                return (
                  <div key={step.key} className="flex items-center gap-1">
                    <div className="flex items-center gap-1">
                      <div
                        className={cn(
                          "flex size-4 items-center justify-center rounded-full text-[8px] font-bold",
                          isCompleted && "bg-emerald-500 text-white",
                          isCurrent && "bg-violet-500 text-white",
                          !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <Check className="size-2.5" /> : i + 1}
                      </div>
                      <span className={cn(
                        "text-[10px]",
                        isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        {step.short}
                      </span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={cn("h-px w-4", i < currentIdx ? "bg-emerald-500/40" : "bg-muted-foreground/15")} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y">
                {selected.messages.map(msg => (
                  <div key={msg.id} className="px-5 py-4">
                    <div className="mb-2 flex items-center gap-2">
                      {msg.role === "ai" ? (
                        <div className="flex size-6 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900">
                          <Sparkles className="size-3 text-violet-600 dark:text-violet-400" />
                        </div>
                      ) : (
                        <div className="flex size-6 items-center justify-center rounded-md bg-muted">
                          <User className="size-3 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-xs font-medium">{msg.role === "ai" ? "Iterate AI" : "You"}</span>
                      <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <div className="pl-8 text-sm leading-relaxed text-foreground/80">
                      {renderMarkdown(msg.content)}
                    </div>
                    {msg.recommendation && (
                      <div className="pl-8">
                        <RecommendationCard rec={msg.recommendation} status={selected.status} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t px-5 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask about this insight or refine the analysis..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                  readOnly
                />
                <Button size="sm" variant="outline" className="shrink-0">
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
