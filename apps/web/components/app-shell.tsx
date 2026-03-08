"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { ChatPanel } from "@/components/chat/chat-panel"

export function AppShell({ children }: { children: React.ReactNode }) {
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
      <Header currentPath={pathname} chatOpen={chatOpen} onToggleChat={() => setChatOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        {chatOpen && (
          <aside className="hidden w-[380px] shrink-0 border-l lg:flex">
            <div className="flex-1">
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
