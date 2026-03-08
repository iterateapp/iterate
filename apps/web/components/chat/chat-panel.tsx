"use client"

import { useState, useRef, useEffect } from "react"
import type { ThreadRow, ThreadMessage } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Send, Sparkles, X, Plus, ChevronLeft } from "lucide-react"

export function ChatPanel({ onClose, initialThreads }: { onClose?: () => void; initialThreads: ThreadRow[] }) {
  const [allThreads, setAllThreads] = useState<ThreadRow[]>(initialThreads)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeThread = allThreads.find((t) => t.id === activeThreadId) ?? null

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [activeThread?.messages.length])

  function handleNewThread() {
    const id = `thread_${Date.now()}`
    const thread: ThreadRow = {
      id,
      title: "New conversation",
      updatedAt: "Just now",
      preview: "",
      messages: [],
    }
    setAllThreads((prev) => [thread, ...prev])
    setActiveThreadId(id)
  }

  function handleSend() {
    const text = input.trim()
    if (!text || !activeThreadId) return
    const msg: ThreadMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }
    setAllThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThreadId) return t
        const isFirst = t.messages.length === 0
        return {
          ...t,
          title: isFirst ? text.slice(0, 40) + (text.length > 40 ? "..." : "") : t.title,
          updatedAt: "Just now",
          preview: text.slice(0, 60),
          messages: [...t.messages, msg],
        }
      })
    )
    setInput("")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          {activeThread ? (
            <button
              onClick={() => setActiveThreadId(null)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
          ) : (
            <div className="flex size-6 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900">
              <Sparkles className="size-3.5 text-violet-600 dark:text-violet-400" />
            </div>
          )}
          <h2 className="truncate text-sm font-semibold">
            {activeThread ? activeThread.title : "Iterate AI"}
          </h2>
        </div>
        <div className="flex items-center gap-0.5">
          {!activeThread && (
            <button
              onClick={handleNewThread}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {activeThread ? (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {activeThread.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900">
                  <Sparkles className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="mt-3 text-sm font-medium">New conversation</p>
                <p className="mt-1 text-xs text-muted-foreground">Ask anything about your product</p>
              </div>
            )}
            {activeThread.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend() }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask about your product..."
                rows={1}
                className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </>
      ) : (
        /* Thread list */
        <div className="flex-1 overflow-y-auto">
          {/* New thread button */}
          <button
            onClick={handleNewThread}
            className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
              <Plus className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">New conversation</p>
              <p className="text-[11px] text-muted-foreground">Start a new thread with AI</p>
            </div>
          </button>

          {/* Existing threads */}
          {allThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Sparkles className="size-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{thread.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{thread.updatedAt}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{thread.preview}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: ThreadMessage }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <div className="whitespace-pre-wrap">
          <MessageContent content={message.content} />
        </div>
        <p className={cn("mt-1.5 text-[10px]", isUser ? "text-primary-foreground/60" : "text-muted-foreground")}>
          {message.createdAt}
        </p>
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*.*?\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        const lines = part.split("\n")
        return lines.map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </span>
        ))
      })}
    </>
  )
}
