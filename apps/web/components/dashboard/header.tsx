import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { iterationSteps, repoInfo } from "@/lib/mock-data"
import {
  ChevronDown,
  Database,
  Sparkles,
  Code,
  BarChart3,
  Bell,
  Settings,
  GitBranch,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

const stepMeta = [
  { icon: Database, color: "text-blue-500" },
  { icon: Sparkles, color: "text-violet-500" },
  { icon: Code, color: "text-emerald-500" },
  { icon: BarChart3, color: "text-amber-500" },
]

export function Header({ currentPath, chatOpen, onToggleChat }: { currentPath?: string; chatOpen?: boolean; onToggleChat?: () => void }) {
  return (
    <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-foreground">
            <Sparkles className="size-3.5 text-background" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Iterate</span>
        </Link>

        <div className="h-4 w-px bg-border" />

        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          Acme Corp
          <ChevronDown className="size-3" />
        </button>

        <div className="h-4 w-px bg-border" />

        {/* Repo context */}
        <div className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground md:flex">
          <GitBranch className="size-3" />
          <span className="font-mono text-[11px]">{repoInfo.fullName}</span>
        </div>

        <div className="hidden h-4 w-px bg-border md:block" />

        {/* Step nav */}
        <nav className="hidden items-center gap-0.5 sm:flex">
          {iterationSteps.map((step, i) => {
            const { icon: Icon, color } = stepMeta[i]
            const isActive = currentPath === step.href
            return (
              <Link
                key={step.href}
                href={step.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className={cn("size-3", isActive ? color : "text-muted-foreground/70")} />
                {step.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <div className="mr-2 flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 dark:border-emerald-800 dark:bg-emerald-950">
          <div className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">Cycle #4</span>
        </div>

        <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="size-3.5" />
        </button>
        <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Settings className="size-3.5" />
        </button>

        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors",
              chatOpen
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <MessageSquare className="size-3.5" />
          </button>
        )}

        <div className="ml-1 h-4 w-px bg-border" />

        <Avatar className="ml-1.5 size-7">
          <AvatarFallback className="text-[10px] font-medium">JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
