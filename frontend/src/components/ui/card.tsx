import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Theme-token-driven card (Shadcn-style, dependency-free). Uses the
 * --color-card / --color-card-border / --color-muted tokens from
 * app/globals.css so surface styling lives in one place.
 */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div
      className={cn(
        "rounded-2xl border border-(--color-card-border) bg-(--color-card) shadow-sm",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactNode {
  return <div className={cn("p-6 pb-3", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>): ReactNode {
  return (
    <h3
      className={cn("text-lg font-bold tracking-tight text-(--color-text-primary)", className)}
      {...rest}
    />
  );
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactNode {
  return <div className={cn("p-6 pt-0", className)} {...rest} />;
}
