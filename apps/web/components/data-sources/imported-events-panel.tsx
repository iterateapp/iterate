import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AmplitudeEvent } from "@/lib/mock-events"
import { Database } from "lucide-react"

interface ImportedEventsPanelProps {
  events: AmplitudeEvent[]
}

export function ImportedEventsPanel({ events }: ImportedEventsPanelProps) {
  const preview = events.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="size-4 text-muted-foreground" />
          <CardTitle>Imported Events</CardTitle>
        </div>
        <CardDescription>
          {events.length} events imported from Amplitude
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Page</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {event.eventType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {event.userId}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {String(event.properties.page)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {events.length > 10 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Showing 10 of {events.length} events
          </p>
        )}
      </CardContent>
    </Card>
  )
}
