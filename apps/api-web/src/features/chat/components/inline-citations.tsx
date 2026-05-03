"use client";

import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationQuote,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import { MessageResponse } from "@/components/ai-elements/message";
import { appPaths } from "@/config/app-paths";

import type { RetrievedChunk } from "@/features/rag/queries/types";
import type { ReactNode } from "react";

const CITATION_MARKER_RE = /(\[\^c\d+\])/;

export interface CitationSegment {
  kind: "text" | "citation" | "unknown-marker";
  value: string;
  marker?: string;
}

export function splitCitationSegments(text: string, sources: RetrievedChunk[]): CitationSegment[] {
  if (!text) return [];
  const sourceByMarker = new Map(sources.map((s) => [s.marker, s]));
  return text
    .split(CITATION_MARKER_RE)
    .filter((part) => part.length > 0)
    .map<CitationSegment>((part) => {
      const match = /^\[\^c(\d+)\]$/.exec(part);
      if (!match) return { kind: "text", value: part };
      const marker = `c${match[1]}`;
      if (!sourceByMarker.has(marker)) return { kind: "unknown-marker", value: part };
      return { kind: "citation", value: part, marker };
    });
}

interface RenderTextWithCitationsProps {
  text: string;
  sources: RetrievedChunk[];
  keyPrefix: string;
}

export function RenderTextWithCitations({
  text,
  sources,
  keyPrefix,
}: RenderTextWithCitationsProps): ReactNode {
  if (sources.length === 0) {
    return <MessageResponse parseIncompleteMarkdown>{text}</MessageResponse>;
  }

  const segments = splitCitationSegments(text, sources);
  const sourceByMarker = new Map(sources.map((s) => [s.marker, s]));

  return (
    <>
      {segments.map((segment, i) => {
        const key = `${keyPrefix}-${i}`;
        if (segment.kind === "citation") {
          const source = sourceByMarker.get(segment.marker!);
          if (!source) return <span key={key}>{segment.value}</span>;
          const index = segment.marker!.replace(/^c/, "");
          return (
            <InlineCitation key={key}>
              <InlineCitationCard>
                <InlineCitationCardTrigger label={index} />
                <InlineCitationCardBody>
                  <InlineCitationSource
                    title={source.documentName}
                    url={appPaths.rag.detail.href(source.documentId, source.chunkId)}
                    description={`Similarity ${(source.similarity * 100).toFixed(1)}%`}
                  />
                  <InlineCitationQuote>{source.content}</InlineCitationQuote>
                </InlineCitationCardBody>
              </InlineCitationCard>
            </InlineCitation>
          );
        }
        if (segment.kind === "unknown-marker") {
          return <span key={key}>{segment.value}</span>;
        }
        return (
          <MessageResponse key={key} parseIncompleteMarkdown>
            {segment.value}
          </MessageResponse>
        );
      })}
    </>
  );
}
