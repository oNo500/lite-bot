"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@workspace/ui/components/hover-card";
import { cn } from "@workspace/ui/lib/utils";

import type { ComponentProps } from "react";

export type InlineCitationProps = ComponentProps<"span">;

export function InlineCitation({ className, ...props }: InlineCitationProps) {
  return <span className={cn("group inline items-center gap-1", className)} {...props} />;
}

export type InlineCitationCardProps = ComponentProps<typeof HoverCard>;

export function InlineCitationCard(props: InlineCitationCardProps) {
  return <HoverCard {...props} />;
}

export type InlineCitationCardTriggerProps = ComponentProps<typeof HoverCardTrigger> & {
  label: string;
};

export function InlineCitationCardTrigger({
  label,
  className,
  ...props
}: InlineCitationCardTriggerProps) {
  return (
    <HoverCardTrigger
      className={cn(
        "mx-0.5 inline-flex h-4 min-w-4 cursor-pointer items-center justify-center rounded-full bg-secondary px-1 align-baseline text-[10px] leading-none font-medium text-secondary-foreground transition-colors hover:bg-secondary/80",
        className,
      )}
      delay={150}
      closeDelay={100}
      {...props}
    >
      {label}
    </HoverCardTrigger>
  );
}

export type InlineCitationCardBodyProps = ComponentProps<typeof HoverCardContent>;

export function InlineCitationCardBody({ className, ...props }: InlineCitationCardBodyProps) {
  return <HoverCardContent className={cn("w-80 space-y-2 p-3", className)} {...props} />;
}

export type InlineCitationSourceProps = ComponentProps<"div"> & {
  title?: string;
  url?: string;
  description?: string;
};

export function InlineCitationSource({
  title,
  url,
  description,
  className,
  children,
  ...props
}: InlineCitationSourceProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {title && <h4 className="truncate text-sm/tight font-medium">{title}</h4>}
      {url && <p className="truncate text-xs break-all text-muted-foreground">{url}</p>}
      {description && (
        <p className="line-clamp-3 text-sm/relaxed text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

export type InlineCitationQuoteProps = ComponentProps<"blockquote">;

export function InlineCitationQuote({ className, children, ...props }: InlineCitationQuoteProps) {
  return (
    <blockquote
      className={cn("border-l-2 border-muted pl-3 text-sm text-muted-foreground italic", className)}
      {...props}
    >
      {children}
    </blockquote>
  );
}
