"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { BookIcon, ChevronDownIcon } from "lucide-react";

import type { ComponentProps } from "react";

export type SourcesProps = ComponentProps<typeof Collapsible>;

export function Sources({ className, ...props }: SourcesProps) {
  return <Collapsible className={cn("mb-3 text-xs text-primary", className)} {...props} />;
}

export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
};

export function SourcesTrigger({ className, count, children, ...props }: SourcesTriggerProps) {
  return (
    <CollapsibleTrigger
      className={cn(
        "flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <p className="font-medium">Used {count} sources</p>
          <ChevronDownIcon className="size-3.5" />
        </>
      )}
    </CollapsibleTrigger>
  );
}

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;

export function SourcesContent({ className, ...props }: SourcesContentProps) {
  return (
    <CollapsibleContent className={cn("mt-2 flex w-fit flex-col gap-1.5", className)} {...props} />
  );
}

export type SourceProps = ComponentProps<"a"> & {
  title?: string;
};

export function Source({ href, title, children, className, ...props }: SourceProps) {
  return (
    <a
      className={cn(
        "flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      href={href}
      rel="noreferrer"
      target="_blank"
      {...props}
    >
      {children ?? (
        <>
          <BookIcon className="size-3.5" />
          <span className="block font-medium">{title}</span>
        </>
      )}
    </a>
  );
}
