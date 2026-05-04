"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { ArrowLeftIcon, Loader2Icon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { appPaths } from "@/config/app-paths";

import {
  useDocumentChunks,
  useRechunkDocument,
  useUpdateChunk,
} from "@/features/rag/hooks/use-document-chunks";

import type { ChunkListItem, DocumentChunksResult } from "@/features/rag/hooks/use-document-chunks";
import type { ChunkConfig } from "@/lib/rag/types";

interface ChunkEditorProps {
  documentId: string;
}

const DEFAULT_CONFIG: ChunkConfig = { strategy: "fixed", size: 512, overlap: 64 };

export function ChunkEditor({ documentId }: ChunkEditorProps) {
  const { data, isLoading, error } = useDocumentChunks(documentId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
          <Skeleton className="h-[60vh]" />
          <Skeleton className="h-[60vh]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-sm text-destructive">加载文档失败</p>
        <Link
          href={appPaths.rag.index.href}
          className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          返回知识库
        </Link>
      </div>
    );
  }

  return <ChunkEditorContent documentId={documentId} data={data} />;
}

interface ChunkEditorContentProps {
  documentId: string;
  data: DocumentChunksResult;
}

function ChunkEditorContent({ documentId, data }: ChunkEditorContentProps) {
  const searchParams = useSearchParams();
  const highlightChunkId = searchParams.get("highlight");

  const [hoveredChunkId, setHoveredChunkId] = useState<string | null>(null);
  const [flashedChunkId, setFlashedChunkId] = useState<string | null>(null);
  const [openEditChunkId, setOpenEditChunkId] = useState<string | null>(null);

  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const chunkRowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const chunkSpanRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Honor ?highlight on mount: scroll both panes, flash the span, open edit row
  useEffect(() => {
    if (!highlightChunkId) return undefined;
    const span = chunkSpanRefs.current.get(highlightChunkId);
    const row = chunkRowRefs.current.get(highlightChunkId);
    span?.scrollIntoView({ behavior: "smooth", block: "center" });
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashedChunkId(highlightChunkId);
    const timer = setTimeout(() => {
      setFlashedChunkId(null);
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, [highlightChunkId]);

  function handleSpanClick(chunkId: string): void {
    const row = chunkRowRefs.current.get(chunkId);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
    setOpenEditChunkId(chunkId);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-7xl flex-col p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={appPaths.rag.index.href}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
            aria-label="返回"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{data.document.name}</h1>
            <p className="text-xs text-muted-foreground">{data.chunks.length} chunks</p>
          </div>
        </div>
        <RechunkToolbar
          documentId={documentId}
          initialConfig={data.document.chunkConfig ?? DEFAULT_CONFIG}
          rawContentAvailable={data.document.rawContent !== null}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <div
          ref={leftPaneRef}
          className="min-h-0 overflow-y-auto rounded-lg border bg-card p-4 text-sm/relaxed"
        >
          <RawContentView
            rawContent={data.document.rawContent}
            chunks={data.chunks}
            hoveredChunkId={hoveredChunkId}
            flashedChunkId={flashedChunkId}
            onHover={setHoveredChunkId}
            onClick={handleSpanClick}
            spanRefs={chunkSpanRefs}
          />
        </div>

        <div ref={rightPaneRef} className="min-h-0 overflow-y-auto rounded-lg border bg-card">
          <div className="divide-y">
            {data.chunks.map((chunk) => (
              <ChunkRow
                key={chunk.id}
                documentId={documentId}
                chunk={chunk}
                isHovered={hoveredChunkId === chunk.id}
                isFlashed={flashedChunkId === chunk.id}
                isOpen={openEditChunkId === chunk.id}
                onHover={setHoveredChunkId}
                onToggleOpen={(open) => {
                  setOpenEditChunkId(open ? chunk.id : null);
                }}
                rowRef={(el) => {
                  if (el) chunkRowRefs.current.set(chunk.id, el);
                  else chunkRowRefs.current.delete(chunk.id);
                }}
              />
            ))}
            {data.chunks.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                尚无 chunks。点击「Re-chunk」根据当前配置生成。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RawContentViewProps {
  rawContent: string | null;
  chunks: ChunkListItem[];
  hoveredChunkId: string | null;
  flashedChunkId: string | null;
  onHover: (chunkId: string | null) => void;
  onClick: (chunkId: string) => void;
  spanRefs: React.RefObject<Map<string, HTMLSpanElement>>;
}

interface RenderSegment {
  text: string;
  start: number;
  chunkId?: string;
}

function buildSegments(rawContent: string, chunks: ChunkListItem[]): RenderSegment[] {
  const sorted = chunks.toSorted((a, b) => a.charStart - b.charStart);
  const segments: RenderSegment[] = [];
  let cursor = 0;
  for (const chunk of sorted) {
    if (chunk.charStart > cursor) {
      segments.push({ text: rawContent.slice(cursor, chunk.charStart), start: cursor });
    }
    const start = Math.max(chunk.charStart, cursor);
    const end = Math.max(chunk.charEnd, start);
    if (end > start) {
      segments.push({ text: rawContent.slice(start, end), start, chunkId: chunk.id });
    }
    cursor = Math.max(cursor, end);
  }
  if (cursor < rawContent.length) {
    segments.push({ text: rawContent.slice(cursor), start: cursor });
  }
  return segments;
}

function RawContentView({
  rawContent,
  chunks,
  hoveredChunkId,
  flashedChunkId,
  onHover,
  onClick,
  spanRefs,
}: RawContentViewProps) {
  const segments = useMemo(() => {
    if (!rawContent) return [];
    return buildSegments(rawContent, chunks);
  }, [rawContent, chunks]);

  if (!rawContent) {
    return (
      <p className="text-muted-foreground italic">
        该文档没有可预览的原始内容（可能为旧文档；请重新上传以启用预览）。
      </p>
    );
  }

  return (
    <div className="wrap-break-word whitespace-pre-wrap">
      {segments.map((seg) => {
        if (!seg.chunkId) {
          return <span key={`gap-${seg.start}`}>{seg.text}</span>;
        }
        const isHovered = hoveredChunkId === seg.chunkId;
        const isFlashed = flashedChunkId === seg.chunkId;
        const className = [
          "cursor-pointer rounded-sm transition-colors",
          isFlashed
            ? "bg-yellow-200 dark:bg-yellow-700/60"
            : isHovered
              ? "bg-primary/15"
              : "hover:bg-primary/10",
        ].join(" ");
        return (
          <span
            key={`${seg.chunkId}-${seg.start}`}
            ref={(el) => {
              if (el) spanRefs.current.set(seg.chunkId!, el);
            }}
            data-chunk-id={seg.chunkId}
            className={className}
            onMouseEnter={() => {
              onHover(seg.chunkId!);
            }}
            onMouseLeave={() => {
              onHover(null);
            }}
            onClick={() => {
              onClick(seg.chunkId!);
            }}
          >
            {seg.text}
          </span>
        );
      })}
    </div>
  );
}

interface ChunkRowProps {
  documentId: string;
  chunk: ChunkListItem;
  isHovered: boolean;
  isFlashed: boolean;
  isOpen: boolean;
  onHover: (chunkId: string | null) => void;
  onToggleOpen: (open: boolean) => void;
  rowRef: (el: HTMLDivElement | null) => void;
}

function ChunkRow({
  documentId,
  chunk,
  isHovered,
  isFlashed,
  isOpen,
  onHover,
  onToggleOpen,
  rowRef,
}: ChunkRowProps) {
  const update = useUpdateChunk(documentId);
  const [draft, setDraft] = useState<string>(chunk.editedContent ?? chunk.content);
  const isEdited = chunk.editedContent !== null;

  useEffect(() => {
    setDraft(chunk.editedContent ?? chunk.content);
  }, [chunk.editedContent, chunk.content]);

  const className = [
    "flex flex-col gap-2 px-4 py-3 transition-colors",
    isFlashed
      ? "bg-yellow-100 dark:bg-yellow-900/30"
      : isHovered
        ? "bg-muted/60"
        : "hover:bg-muted/40",
  ].join(" ");

  const previewContent = chunk.editedContent ?? chunk.content;
  const collapsed =
    previewContent.length > 100 && !isOpen ? `${previewContent.slice(0, 100)}…` : previewContent;

  function handleToggleEnabled(next: boolean): void {
    update.mutate({ chunkId: chunk.id, patch: { enabled: next } });
  }

  function handleSaveEdit(): void {
    const nextValue = draft === chunk.content ? null : draft;
    update.mutate(
      { chunkId: chunk.id, patch: { editedContent: nextValue } },
      {
        onSuccess: () => {
          toast.success("Chunk 已更新");
          onToggleOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "保存失败");
        },
      },
    );
  }

  function handleResetEdit(): void {
    update.mutate(
      { chunkId: chunk.id, patch: { editedContent: null } },
      {
        onSuccess: () => {
          toast.success("已恢复为原始内容");
          setDraft(chunk.content);
          onToggleOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "重置失败");
        },
      },
    );
  }

  return (
    <div
      ref={rowRef}
      className={className}
      onMouseEnter={() => {
        onHover(chunk.id);
      }}
      onMouseLeave={() => {
        onHover(null);
      }}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
          #{chunk.chunkIndex + 1}
        </span>
        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {chunk.tokenCount} tok
        </span>
        {isEdited && (
          <span className="rounded-sm border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
            edited
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Switch
            checked={chunk.enabled}
            onCheckedChange={handleToggleEnabled}
            disabled={update.isPending}
            aria-label={chunk.enabled ? "禁用 chunk" : "启用 chunk"}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => {
              onToggleOpen(!isOpen);
            }}
            aria-label="编辑 chunk"
          >
            <PencilIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {!isOpen && (
        <p
          className={`text-xs/relaxed wrap-break-word whitespace-pre-wrap ${chunk.enabled ? "" : "text-muted-foreground line-through"}`}
        >
          {collapsed}
        </p>
      )}

      {isOpen && (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
            }}
            rows={Math.min(12, Math.max(4, draft.split("\n").length + 1))}
            className="font-mono text-xs"
          />
          <div className="flex items-center justify-end gap-2">
            {isEdited && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetEdit}
                disabled={update.isPending}
              >
                重置原始内容
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(chunk.editedContent ?? chunk.content);
                onToggleOpen(false);
              }}
              disabled={update.isPending}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={update.isPending || draft === (chunk.editedContent ?? chunk.content)}
            >
              {update.isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : "保存"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface RechunkToolbarProps {
  documentId: string;
  initialConfig: ChunkConfig;
  rawContentAvailable: boolean;
}

function RechunkToolbar({ documentId, initialConfig, rawContentAvailable }: RechunkToolbarProps) {
  const [strategy, setStrategy] = useState<ChunkConfig["strategy"]>(initialConfig.strategy);
  const [size, setSize] = useState<number>(initialConfig.size);
  const [overlap, setOverlap] = useState<number>(initialConfig.overlap);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const rechunk = useRechunkDocument(documentId);

  function handleConfirmRechunk(): void {
    rechunk.mutate(
      { strategy, size, overlap },
      {
        onSuccess: () => {
          toast.success("Chunks 已重新生成");
          setConfirmOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "重新生成失败");
        },
      },
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={strategy}
        onValueChange={(v) => {
          setStrategy(v!);
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fixed">fixed</SelectItem>
          <SelectItem value="semantic" disabled>
            semantic（暂未实现）
          </SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={32}
        max={4096}
        value={size}
        onChange={(e) => {
          setSize(Number(e.target.value));
        }}
        className="w-20"
        aria-label="size"
      />
      <Input
        type="number"
        min={0}
        max={1024}
        value={overlap}
        onChange={(e) => {
          setOverlap(Number(e.target.value));
        }}
        className="w-20"
        aria-label="overlap"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setConfirmOpen(true);
        }}
        disabled={!rawContentAvailable || rechunk.isPending}
      >
        {rechunk.isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : "Re-chunk"}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认重新生成 chunks？</DialogTitle>
            <DialogDescription>
              该操作将删除当前文档的所有 chunks（包含已编辑内容与禁用状态），
              并按当前配置重新切分与嵌入。该过程不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="ghost" disabled={rechunk.isPending}>
                  取消
                </Button>
              }
            />
            <Button onClick={handleConfirmRechunk} disabled={rechunk.isPending}>
              {rechunk.isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
