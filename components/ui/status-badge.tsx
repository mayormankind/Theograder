import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusVariant = "teal" | "blue" | "amber" | "slate" | "red" | "violet"

interface StatusConfig {
  variant: StatusVariant
  label: string
  dot: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  GRADED:        { variant: "teal",   label: "Graded",       dot: "bg-teal-400" },
  PROCESSING:    { variant: "blue",   label: "Processing",   dot: "bg-blue-400" },
  PENDING_REVIEW:{ variant: "amber",  label: "Needs Review", dot: "bg-amber-400" },
  UPLOADED:      { variant: "slate",  label: "Queued",       dot: "bg-slate-300" },
  DRAFT:         { variant: "slate",  label: "Draft",        dot: "bg-slate-300" },
  ACTIVE:        { variant: "teal",   label: "Active",       dot: "bg-teal-400" },
  COMPLETED:     { variant: "blue",   label: "Completed",    dot: "bg-blue-400" },
  ARCHIVED:      { variant: "amber",  label: "Archived",     dot: "bg-amber-400" },
  done:          { variant: "teal",   label: "Graded",       dot: "bg-teal-400" },
  processing:    { variant: "blue",   label: "Processing",   dot: "bg-blue-400" },
  pending_review:{ variant: "amber",  label: "Review Needed",dot: "bg-amber-400" },
  uploaded:      { variant: "slate",  label: "Queued",       dot: "bg-slate-300" },
}

interface StatusBadgeProps {
  status: string
  className?: string
  showDot?: boolean
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? {
    variant: "slate" as StatusVariant,
    label: status,
    dot: "bg-slate-300",
  }

  return (
    <Badge
      variant={cfg.variant as "teal" | "blue" | "amber" | "slate" | "red" | "violet"}
      className={cn("gap-1.5 rounded-full", className)}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      )}
      {cfg.label}
    </Badge>
  )
}
