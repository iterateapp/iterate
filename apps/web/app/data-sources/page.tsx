"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { IntegrationCard } from "@/components/data-sources/integration-card"
import { AmplitudeConnectModal } from "@/components/data-sources/amplitude-connect-modal"
import { ImportedEventsPanel } from "@/components/data-sources/imported-events-panel"
import { Button } from "@/components/ui/button"
import { generateMockEvents, type AmplitudeEvent } from "@/lib/mock-events"
import {
  BarChart3,
  PieChart,
  Bug,
  MessageSquare,
  Download,
  Loader2,
} from "lucide-react"

interface AmplitudeConfig {
  apiKey: string
  projectId: string
}

export default function DataSourcesPage() {
  const [amplitudeConfig, setAmplitudeConfig] =
    useState<AmplitudeConfig | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [events, setEvents] = useState<AmplitudeEvent[]>([])
  const [importing, setImporting] = useState(false)

  const isConnected = amplitudeConfig !== null

  const handleConnect = useCallback((config: AmplitudeConfig) => {
    setAmplitudeConfig(config)
    setModalOpen(false)
  }, [])

  function handleImport() {
    setImporting(true)
    setTimeout(() => {
      setEvents(generateMockEvents())
      setImporting(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight">
            Connect Data Sources
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your product and communication tools to start the AI
            analysis loop.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <IntegrationCard
            name="Amplitude"
            description="Product analytics"
            icon={<BarChart3 className="size-5" />}
            available
            connected={isConnected}
            onConnect={() => setModalOpen(true)}
          />
          <IntegrationCard
            name="Mixpanel"
            description="Product analytics"
            icon={<PieChart className="size-5" />}
            available={false}
            connected={false}
            onConnect={() => {}}
          />
          <IntegrationCard
            name="Sentry"
            description="Error monitoring"
            icon={<Bug className="size-5" />}
            available={false}
            connected={false}
            onConnect={() => {}}
          />
          <IntegrationCard
            name="Slack"
            description="User feedback & communication"
            icon={<MessageSquare className="size-5" />}
            available={false}
            connected={false}
            onConnect={() => {}}
          />
        </div>

        {isConnected && events.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed p-8">
            <p className="text-sm text-muted-foreground">
              Amplitude connected. Import product events to begin analysis.
            </p>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 size-3.5" />
                  Import Product Events
                </>
              )}
            </Button>
          </div>
        )}

        {events.length > 0 && (
          <div className="mt-8">
            <ImportedEventsPanel events={events} />
          </div>
        )}

        <AmplitudeConnectModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onConnect={handleConnect}
        />
      </main>
    </div>
  )
}
