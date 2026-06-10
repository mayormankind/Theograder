import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
  className?: string
  size?: number
}

export function PageLoader({ className, size = 24 }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] items-center justify-center",
        className,
      )}
    >
      <Loader2 size={size} className="animate-spin text-muted-foreground" />
    </div>
  )
}
