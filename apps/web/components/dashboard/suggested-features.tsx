import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { suggestedFeatures, type FeatureStatus } from "@/lib/mock-data"
import { List } from "lucide-react"

const statusVariant: Record<FeatureStatus, "default" | "secondary" | "outline"> = {
  Proposed: "outline",
  Approved: "secondary",
  "In Progress": "default",
}

export function SuggestedFeatures() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <List className="size-4 text-muted-foreground" />
          <CardTitle>AI Suggested Features</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature Name</TableHead>
              <TableHead className="text-right">Impact</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suggestedFeatures.map((feature) => (
              <TableRow key={feature.name}>
                <TableCell className="font-medium">{feature.name}</TableCell>
                <TableCell className="text-right">
                  {feature.impactScore}
                </TableCell>
                <TableCell className="text-right">
                  {feature.confidence}%
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={statusVariant[feature.status]}>
                    {feature.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
