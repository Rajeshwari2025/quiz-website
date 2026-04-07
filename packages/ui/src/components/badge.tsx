import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-700",
        className,
      )}
      {...props}
    />
  );
}
