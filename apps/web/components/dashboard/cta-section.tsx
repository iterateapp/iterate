import { Button } from "@/components/ui/button"
import { Play, FileSearch } from "lucide-react"

export function CtaSection() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 sm:flex-row sm:justify-center">
      <Button size="lg">
        <Play className="mr-1.5 size-3.5" />
        Run New Analysis
      </Button>
      <Button variant="outline" size="lg">
        <FileSearch className="mr-1.5 size-3.5" />
        Review AI Proposals
      </Button>
    </div>
  )
}
