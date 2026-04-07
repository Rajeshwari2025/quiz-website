import * as React from "react";
import { cn } from "../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white shadow-sm hover:bg-[var(--color-accent-strong)]",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function buttonClassName({
  variant = "primary",
  className,
}: {
  variant?: ButtonVariant;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60",
    variantStyles[variant],
    className,
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClassName({ variant, className })}
      {...props}
    />
  ),
);

Button.displayName = "Button";
