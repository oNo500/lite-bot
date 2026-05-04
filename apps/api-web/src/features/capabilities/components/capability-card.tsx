import { Badge } from "@workspace/ui/components/badge";
import { BotIcon } from "lucide-react";

import type { CapabilityInfo } from "@/features/capabilities/queries/get-flow-info";

interface CapabilityCardProps {
  info: CapabilityInfo;
}

const HOOK_LABELS: Record<keyof CapabilityInfo["hooks"], string> = {
  preStream: "预处理",
  buildSystemPrompt: "system prompt",
  buildTools: "tools",
  onStreamStart: "stream 写入",
};

export function CapabilityCard({ info }: CapabilityCardProps) {
  const activeHooks = (Object.keys(info.hooks) as (keyof CapabilityInfo["hooks"])[]).filter(
    (key) => info.hooks[key],
  );

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          <BotIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{info.meta.name}</span>
          <Badge variant="secondary" className="font-mono text-xs">
            {info.id}
          </Badge>
        </div>
        <Badge variant={info.enabled ? "default" : "outline"}>
          {info.enabled ? "启用" : "停用"}
        </Badge>
      </div>

      <div className="space-y-3 border-t p-4">
        <p className="text-sm text-muted-foreground">{info.meta.description}</p>

        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">激活的钩子</span>
          <div className="flex flex-wrap gap-1.5">
            {activeHooks.length === 0 ? (
              <span className="text-xs text-muted-foreground">无</span>
            ) : (
              activeHooks.map((key) => (
                <Badge key={key} variant="outline" className="font-mono text-xs">
                  {HOOK_LABELS[key]}
                </Badge>
              ))
            )}
          </div>
        </div>

        {Boolean(info.config) && Object.keys(info.config as object).length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">配置</span>
            <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs">
              {JSON.stringify(info.config, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
