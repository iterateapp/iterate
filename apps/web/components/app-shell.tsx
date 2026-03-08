"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { ChatPanel } from "@/components/chat/chat-panel"
import type { ThreadRow, LoopStep, RepoInfo } from "@/lib/types"

export function AppShell({
  children,
  initialThreads,
  iterationSteps,
  repoInfo,
}: {
  children: React.ReactNode
  initialThreads: ThreadRow[]
  iterationSteps: LoopStep[]
  repoInfo: RepoInfo | null
}) {
  const [chatOpen, setChatOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setChatOpen(localStorage.getItem("chatOpen") === "true")
  }, [])

  useEffect(() => {
    localStorage.setItem("chatOpen", String(chatOpen))
  }, [chatOpen])

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        currentPath={pathname}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
        iterationSteps={iterationSteps}
        repoInfo={repoInfo}
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        {chatOpen && (
          <aside className="hidden w-[380px] shrink-0 border-l lg:flex">
            <div className="flex-1">
              <ChatPanel onClose={() => setChatOpen(false)} initialThreads={initialThreads} />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
