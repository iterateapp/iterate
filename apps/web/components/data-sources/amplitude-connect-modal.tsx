"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface AmplitudeConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: (config: { apiKey: string; projectId: string }) => void
}

export function AmplitudeConnectModal({
  open,
  onOpenChange,
  onConnect,
}: AmplitudeConnectModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [projectId, setProjectId] = useState("")
  const [connecting, setConnecting] = useState(false)

  const canSubmit = apiKey.trim() !== "" && projectId.trim() !== ""

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setConnecting(true)
    // Simulate connection delay
    setTimeout(() => {
      onConnect({ apiKey: apiKey.trim(), projectId: projectId.trim() })
      setConnecting(false)
      setApiKey("")
      setProjectId("")
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Amplitude</DialogTitle>
          <DialogDescription>
            Enter your Amplitude API credentials to import product analytics
            data.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                placeholder="Enter your Amplitude API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-id">Project ID</Label>
              <Input
                id="project-id"
                placeholder="Enter your project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={!canSubmit || connecting}>
              {connecting ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
