import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer", className)}
      style={style}
      {...props}
    />
  )
}
