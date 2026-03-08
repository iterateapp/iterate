import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { IterationLoop } from "@/components/dashboard/iteration-loop"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  insights,
  aiSuggestions,
  analysisChatMessages,
  type InsightCategory,
  type SuggestionType,
} from "@/lib/mock-data"
import {
  Sparkles,
  TrendingUp,
  Shield,
  Users,
  Download,
  PieChart,
  CornerDownLeft,
  ArrowRight,
  Send,
  Bot,
  User,
} from "lucide-react"

const categoryLabel: Record<InsightCategory, string> = { engagement: "Engagement", retention: "Retention", conversion: "Conversion", performance: "Performance" }
const categoryColor: Record<InsightCategory, string> = {
  engagement: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  retention: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  conversion: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  performance: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
}

const suggestionIcon: Record<SuggestionType, typeof Users> = { interview: Users, data_fetch: Download, cohort_analysis: PieChart }
const priorityColor = { high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", low: "bg-secondary text-secondary-foreground" }

function renderMarkdown(text: string) {
  // Simple inline markdown: **bold**, > blockquote, \n
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

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/" />
      <main className="mx-auto max-w-[1200px] px-8 py-8">
        <IterationLoop currentHref="/analysis" />

        <div className="mt-8 mb-8 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
            <Sparkles className="size-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Analysis</h1>
            <p className="text-sm text-muted-foreground">AI-powered analysis — refine insights, plan next steps</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── Left: AI Chat ── */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Bot className="size-4 text-violet-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI Conversation</h2>
            </div>

            <div className="rounded-xl border bg-card ring-1 ring-foreground/10">
              {/* Messages */}
              <div className="divide-y">
                {analysisChatMessages.map(msg => (
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
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask a follow-up or refine the analysis..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    readOnly
                  />
                  <Button size="sm" variant="outline" className="shrink-0">
                    <Send className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick actions below chat */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                Summarize all insights
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Compare with last cycle
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Prioritize by effort
              </Button>
            </div>
          </section>

          {/* ── Right: Actions sidebar ── */}
          <aside className="space-y-6">
            {/* Promote to Development */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <ArrowRight className="size-4 text-emerald-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ready for Step 3</h2>
              </div>
              <div className="space-y-2">
                {insights.filter(i => i.confidence >= 75).slice(0, 4).map(insight => (
                  <div key={insight.id} className="rounded-xl border bg-card p-3.5 ring-1 ring-foreground/10">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium leading-snug">{insight.recommendation}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge variant="secondary" className={`text-[10px] ${categoryColor[insight.category]}`}>
                            {categoryLabel[insight.category]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{insight.impactScore} impact · {insight.confidence}% conf</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <Button size="sm" className="h-7 w-full text-xs">
                        Generate Feature
                        <ArrowRight className="ml-1 size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions → Data */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <CornerDownLeft className="size-4 text-amber-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Collect More Data</h2>
              </div>
              <div className="space-y-2">
                {aiSuggestions.map(s => {
                  const Icon = suggestionIcon[s.type]
                  return (
                    <div key={s.id} className="rounded-xl border border-dashed border-amber-300/60 bg-amber-50/30 p-3.5 dark:border-amber-800/60 dark:bg-amber-950/20">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400">
                          <Icon className="size-3" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium">{s.title}</p>
                            <Badge variant="secondary" className={`text-[9px] ${priorityColor[s.priority]}`}>
                              {s.priority}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{s.description}</p>
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                            <CornerDownLeft className="size-2.5" />
                            → {s.feedsBackTo}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* ── Full Insights List ── */}
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">All Insights</h2>
            <Badge variant="secondary" className="text-[10px]">{insights.length}</Badge>
          </div>

          <div className="space-y-3">
            {insights.map(insight => (
              <div key={insight.id} className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10 transition-all hover:ring-foreground/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={categoryColor[insight.category]}>
                        {categoryLabel[insight.category]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{insight.createdAt}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-snug">{insight.problem}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{insight.evidence}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Recommendation:</span>
                        <span className="text-xs font-medium">{insight.recommendation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Need More Data
                          <CornerDownLeft className="ml-1 size-3" />
                        </Button>
                        <Button size="sm" className="h-7 text-xs">
                          Generate Feature
                          <ArrowRight className="ml-1 size-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{insight.source}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="size-3" />
                        <span className="text-[10px] uppercase tracking-wider">Impact</span>
                      </div>
                      <p className="text-lg font-semibold">{insight.impactScore}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Shield className="size-3" />
                        <span className="text-[10px] uppercase tracking-wider">Confidence</span>
                      </div>
                      <p className="text-lg font-semibold">{insight.confidence}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
