import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowRight } from "lucide-react"

interface IntegrationCardProps {
  name: string
  description: string
  logoSrc: string
  connected: boolean
  onConnect: () => void
}

export function IntegrationCard({
  name,
  description,
  logoSrc,
  connected,
  onConnect,
}: IntegrationCardProps) {
  if (connected) {
    return (
      <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4 ring-1 ring-foreground/10">
        <Image
          src={logoSrc}
          alt={name}
          width={40}
          height={40}
          className="rounded-lg"
        />
        <div className="flex-1">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Check className="size-3" />
          Connected
        </Badge>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onConnect}
      className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border bg-card px-5 py-4 text-left ring-1 ring-foreground/10 transition-all hover:ring-foreground/25 hover:shadow-sm active:scale-[0.995]"
    >
      <Image
        src={logoSrc}
        alt={name}
        width={40}
        height={40}
        className="rounded-lg"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
