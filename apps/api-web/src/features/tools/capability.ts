import { aiTools } from "@/lib/ai/tools";

import type { ChatCapability } from "@/features/chat/types";

export const capability: ChatCapability = {
  id: "tools",
  meta: {
    name: "工具调用",
    description: "为模型提供基础工具，包括获取当前时间和数学表达式求值。",
  },
  buildTools: () => aiTools,
};
