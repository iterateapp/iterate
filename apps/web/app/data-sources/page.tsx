"use client"

import { useState, useCallback } from "react"
import { IntegrationCard } from "@/components/data-sources/integration-card"
import { AmplitudeConnectModal } from "@/components/data-sources/amplitude-connect-modal"
import { ImportedEventsPanel } from "@/components/data-sources/imported-events-panel"
import { Button } from "@/components/ui/button"
import { generateMockEvents, type AmplitudeEvent } from "@/lib/mock-events"
import { Download, Loader2 } from "lucide-react"

interface AmplitudeConfig {
  apiKey: string
  projectId: string
}

const integrations = [
  {
    name: "Amplitude",
    description: "Product analytics — events, funnels, retention",
    logoSrc: "/logos/amplitude.svg",
  },
  {
    name: "Mixpanel",
    description: "Product analytics — user flows, A/B tests",
    logoSrc: "/logos/mixpanel.svg",
  },
  {
    name: "Sentry",
    description: "Error monitoring — crashes, performance issues",
    logoSrc: "/logos/sentry.svg",
  },
  {
    name: "Slack",
    description: "Communication — user feedback, team threads",
    logoSrc: "/logos/slack.svg",
  },
] as const

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
    <div className="mx-auto max-w-[1200px] px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight">
            Data Sources
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your tools to power the AI analysis loop.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {integrations.map((item) => (
            <IntegrationCard
              key={item.name}
              name={item.name}
              description={item.description}
              logoSrc={item.logoSrc}
              connected={item.name === "Amplitude" && isConnected}
              onConnect={() => setModalOpen(true)}
            />
          ))}
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
                  Importing…
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
    </div>
  )
}
