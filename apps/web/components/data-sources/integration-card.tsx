import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface IntegrationCardProps {
  name: string
  description: string
  icon: React.ReactNode
  available: boolean
  connected: boolean
  onConnect: () => void
}

export function IntegrationCard({
  name,
  description,
  icon,
  available,
  connected,
  onConnect,
}: IntegrationCardProps) {
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              {icon}
            </div>
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription className="mt-0.5">
                {description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1">
              <Check className="size-3" />
              Connected
            </Badge>
          </div>
        ) : available ? (
          <Button size="sm" onClick={onConnect}>
            Connect
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
