import * as React from "react";
import { cn } from "../lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
