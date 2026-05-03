import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DEFAULT_FLOW } from "@/app/_capabilities/default-flow";
import { appPaths } from "@/config/app-paths";
import { CapabilityCard } from "@/features/capabilities/components/capability-card";
import { getFlowInfo } from "@/features/capabilities/queries/get-flow-info";
import { auth } from "@/lib/auth";

export default async function CapabilitiesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(appPaths.auth.guest.getHref(appPaths.capabilities.index.href));

  const info = getFlowInfo(DEFAULT_FLOW);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">能力配置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          每次对话按顺序激活以下能力。当前为全局默认配置，修改请编辑{" "}
          <code className="font-mono text-xs">app/_capabilities/default-flow.ts</code>。
        </p>
      </div>

      <div className="space-y-4">
        {info.capabilities.map((cap) => (
          <CapabilityCard key={cap.id} info={cap} />
        ))}

        <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Agent loop max steps: </span>
          <span className="font-mono">{info.agentLoop.maxSteps}</span>
        </div>
      </div>
    </div>
  );
}
