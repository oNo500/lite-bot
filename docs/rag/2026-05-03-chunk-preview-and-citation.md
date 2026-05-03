# Chat Capabilities Architecture + RAG (Chunk Preview & Citation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure chat as a **capability-slot** architecture where RAG is the first concrete capability. Land RAG with chunk preview + traceable citations on top of the new architecture, using ai-elements components for UI.

**Why both at once:** RAG is the first non-trivial chat capability. Building the slot architecture first means future capabilities (web-search, memory, custom agents, reasoning) plug in via the same interface — zero chat-route changes per new capability. Doing RAG against a temporary architecture would force a redo.

**Architecture:**

- `features/{capability}/` — each capability is a feature implementing `ChatCapability` interface
- `app/(dashboard)/api/chat/route.ts` — composes capabilities via a registry; chat mutation knows nothing about specific capabilities
- `lib/rag/` — pure primitives (chunk, embed) only
- Cross-feature collaboration via the **app-layer assembly** rule (see `.claude/rules/api-web.md`)

**Tech Stack:** Next.js 16 App Router, AI SDK v6, Drizzle ORM 0.44 + pgvector, Vitest, Better Auth, ai-elements (`Sources`, `InlineCitation`, `Agent`), shadcn/Base UI.

**Status legend:**

- **Locked** — task list executable as-is
- **Spec** — design + acceptance criteria settled, task breakdown deferred

---

## Architectural Decisions (locked)

These shape every step. Settled in conversation; documenting so future contributors don't re-litigate.

### Decision 1 — Chat is a capability host, not a fixed pipeline

`features/chat/mutations/streamChat` knows nothing about RAG, web-search, memory, or any specific capability. It accepts a generic `ChatContext`:

```ts
interface ChatContext {
  messages: ModelMessage[]
  systemPrompts: string[]      // from capabilities, joined into final system
  tools: ToolSet                // accumulated from capabilities
  metadata: Record<string, unknown>  // capability-specific data flowing through stream
  model: string
  agentLoop: { maxSteps: number }
}
```

Capabilities mutate this context before the stream starts; chat just runs `streamText`.

### Decision 2 — `ChatCapability` is the universal interface

```ts
interface ChatCapability<TConfig = unknown> {
  id: string                                              // 'rag' | 'web-search' | ...
  preStream?(ctx: ChatContext, config: TConfig): Promise<ChatContext>
  buildSystemPrompt?(ctx: ChatContext, config: TConfig): Promise<string | null>
  buildTools?(ctx: ChatContext, config: TConfig): ToolSet
  onStreamStart?(writer: StreamWriter, ctx: ChatContext, config: TConfig): Promise<void>
  // postStream / onFinish hooks deferred to Phase 2
}
```

Each capability lives in `features/{capability-id}/` and exports a `capability` constant implementing this interface.

### Decision 3 — Capability registry assembled at app layer

`features/` MUST NOT know about each other. The capability registry is built in `app/`:

```ts
// app/(dashboard)/api/chat/_lib/registry.ts
import { capability as ragCapability } from '@/features/rag/capability'
import { capability as toolsCapability } from '@/features/tools/capability'

export const registry: Record<string, ChatCapability> = {
  rag: ragCapability,
  tools: toolsCapability,
}
```

`features/chat` imports only the `ChatCapability` type, never any specific capability.

### Decision 4 — Phase 0 config: global default only

Per Q2: capability config is **global, not per-user, not per-session**. Configuration lives in `app/(dashboard)/api/chat/_lib/default-flow.ts` as a typed constant. User-level / session-level / canvas editor are out of scope for this plan.

### Decision 5 — Citation UI uses ai-elements primitives

Use `<Sources>`, `<InlineCitation>` from ai-elements. Do not write a custom remark plugin. RAG retrieval output uses AI SDK source-url parts shape so existing components work without adapter code.

### Decision 6 — `lib/rag/` retained for pure primitives

`chunkText`, `embedTexts` stay in `lib/rag/` — pure, business-unaware, no `userId` or db awareness. Anything touching ownership, status, or building prompts goes to `features/rag/`.

### Decision 7 — `db/rag-queries.ts` is deleted

Per the architecture rule, route handlers and `lib/` MUST NOT call `db` directly. All db access goes through `features/{capability}/queries/` or `features/{capability}/mutations/`.

### Decision 8 — Type-only cross-feature imports allowed

Per the rule update, `import type {...}` across features is fine. Runtime imports remain forbidden. The `ChatCapability` type lives in `features/chat/types.ts` and capabilities import it via `import type`.

---

## References

### Architecture inspiration

- [infiniflow/ragflow](https://github.com/infiniflow/ragflow) — overall RAG reference
- [Dify](https://github.com/langgenius/dify) — capability/workflow product reference (later phases)
- AI SDK v6 [`ToolLoopAgent` / streaming](https://ai-sdk.dev/docs) — pipeline mental model

### TS-side prior art

- [vercel/ai-sdk-rag-starter](https://github.com/vercel/ai-sdk-rag-starter) — closest same-stack starter
- [HamedMP/NextRag](https://github.com/HamedMP/NextRag) — multi-strategy chunking + Inngest async ingest

### ai-elements components used

- `<Sources>` / `<SourcesTrigger>` / `<SourcesContent>` / `<Source>` — collapsible source list per assistant message
- `<InlineCitation>` / `<InlineCitationCard>` / `<InlineCitationCardTrigger>` / `<InlineCitationCardBody>` / `<InlineCitationSource>` / `<InlineCitationQuote>` — hover-reveal in-text citation
- `<Agent>` (later phase) — visualize capability config in admin/settings UI

Install command: `pnpm dlx ai-elements@latest add sources inline-citation`

> [!IMPORTANT]
> The inline-citation docs note that streamdown does not natively support footnote→citation conversion. Approach: model emits `[1] [2]` style numeric markers; frontend splits text on `/(\[\d+\])/` and renders `<InlineCitation>` for matched markers, plain text for unmatched. Sources list for that message comes from `data-rag-sources` stream part written in Phase 1.

### Existing code touch points

- `apps/api-web/src/app/(chat)/api/chat/route.ts` — chat route (existing)
- `apps/api-web/src/app/(chat)/api/chat/_lib/stream-chat.ts:46-132` — current `streamAuthenticatedChat`/`streamEphemeralChat`
- `apps/api-web/src/lib/ai/tools.ts` — current `aiTools` (becomes `tools` capability)
- `apps/api-web/src/lib/rag/{chunk,embed,retrieve}.ts` — keep `chunk`/`embed`, delete `retrieve`
- `apps/api-web/src/db/rag-queries.ts` — delete, logic moves to `features/rag/queries/`
- `apps/api-web/src/db/schema.ts:152-182` — `ragDocument` / `ragChunk` schema
- `apps/api-web/src/components/ai-elements/{message,prompt-input,shimmer}.tsx` — already installed

> [!NOTE]
> Existing `(rag)` and `(chat)` route groups don't match the rule's `(landing)/(auth)/(dashboard)`. Migrating them is out of scope for this plan; new routes use `(dashboard)`. Existing routes stay where they are, just refactored internally.

---

## Phase Map

| Phase | Goal | Status |
|-|-|-|
| 0 | HOF infrastructure (`withAuth`, `withErrorHandler`) | **Locked** |
| 1 | Capability slot architecture + migrate `aiTools` to `tools` capability | **Locked** |
| 2 | Schema + chunk primitives | **Locked** |
| 3 | RAG capability implementation (replaces `useRag` boolean) | **Locked** |
| 4 | RAG citation UI (ai-elements `Sources` + `InlineCitation`) | **Spec** |
| 5 | Chunk management API (`PATCH /chunks/[id]`, `POST .../rechunk`) | **Spec** |
| 6 | Chunk preview page UI | **Spec** |

> [!IMPORTANT]
> Phases 0–3 must land **in order** — each builds on the previous. Phases 4–6 are mostly independent and can be parallelized after Phase 3 lands.

---

## Phase 0 — Route handler HOFs [Locked]

**Why first:** Architecture rule mandates `withErrorHandler(withAuth(...))` for business routes. Currently absent. Build them once, every later phase reuses.

### Files

- Create: `apps/api-web/src/lib/api/types.ts`
- Create: `apps/api-web/src/lib/api/with-auth.ts` + `.test.ts`
- Create: `apps/api-web/src/lib/api/with-error-handler.ts` + `.test.ts`

### Tasks

- [ ] **Step 0.1: Define handler types**

`apps/api-web/src/lib/api/types.ts`:

```ts
import type { Session, User } from 'better-auth'

export interface AuthedContext {
  session: { user: User, session: Session }
}

export type RouteHandler<TParams = unknown> = (
  req: Request,
  context: { params: Promise<TParams> },
) => Promise<Response>

export type AuthedRouteHandler<TParams = unknown> = (
  req: Request,
  context: { params: Promise<TParams>, auth: AuthedContext },
) => Promise<Response>
```

- [ ] **Step 0.2: Failing withAuth tests**

`apps/api-web/src/lib/api/with-auth.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import { withAuth } from './with-auth'

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('next/headers', () => ({ headers: () => new Headers() }))

describe('withAuth', () => {
  it('returns 401 when no session', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const handler = withAuth(async () => Response.json({ ok: true }))
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })

    expect(res.status).toBe(401)
  })

  it('passes session to inner handler when authed', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'u1' },
      session: { id: 's1' },
    } as never)

    const handler = withAuth(async (_req, ctx) => Response.json({ uid: ctx.auth.session.user.id }))
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })

    expect(await res.json()).toEqual({ uid: 'u1' })
  })
})
```

- [ ] **Step 0.3: Run, confirm fail**

```bash
pnpm --filter api-web test with-auth.test
```

- [ ] **Step 0.4: Implement withAuth**

`apps/api-web/src/lib/api/with-auth.ts`:

```ts
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

import type { AuthedRouteHandler, RouteHandler } from './types'

export function withAuth<TParams = unknown>(
  handler: AuthedRouteHandler<TParams>,
): RouteHandler<TParams> {
  return async (req, { params }) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(req, { params, auth: { session } })
  }
}
```

- [ ] **Step 0.5: Confirm pass**

```bash
pnpm --filter api-web test with-auth.test
```

- [ ] **Step 0.6–0.8: Same TDD cycle for `withErrorHandler`**

Test file `apps/api-web/src/lib/api/with-error-handler.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { withErrorHandler } from './with-error-handler'

describe('withErrorHandler', () => {
  it('passes through 2xx responses', async () => {
    const handler = withErrorHandler(async () => Response.json({ ok: true }))
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })
    expect(res.status).toBe(200)
  })

  it('maps ZodError to 400', async () => {
    const schema = z.object({ name: z.string() })
    const handler = withErrorHandler(async () => {
      schema.parse({ name: 123 })
      return Response.json({ ok: true })
    })
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })
    const body = await res.json() as { error: string, issues: unknown[] }
    expect(res.status).toBe(400)
    expect(body.error).toBe('ValidationError')
  })

  it('maps unknown error to 500', async () => {
    const handler = withErrorHandler(async () => { throw new Error('boom') })
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })
    expect(res.status).toBe(500)
  })
})
```

Implementation `apps/api-web/src/lib/api/with-error-handler.ts`:

```ts
import { ZodError } from 'zod'

import type { RouteHandler } from './types'

export function withErrorHandler<TParams = unknown>(
  handler: RouteHandler<TParams>,
): RouteHandler<TParams> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json({ error: 'ValidationError', issues: error.issues }, { status: 400 })
      }
      console.error('[route]', error)
      return Response.json({ error: 'InternalServerError' }, { status: 500 })
    }
  }
}
```

- [ ] **Step 0.9: Commit**

```bash
git add apps/api-web/src/lib/api/
git commit -m "feat(api): add withAuth and withErrorHandler route HOFs"
```

---

## Phase 1 — Capability slot architecture [Locked]

**Why second:** Establishes the contract every later phase plugs into. By migrating the trivial `tools` capability first, we prove the architecture works before touching RAG.

### Files

- Create: `apps/api-web/src/features/chat/types.ts` — `ChatCapability`, `ChatContext`, related types
- Create: `apps/api-web/src/features/chat/lib/run-capabilities.ts` — pipeline runner
- Create: `apps/api-web/src/features/chat/lib/run-capabilities.test.ts`
- Create: `apps/api-web/src/features/chat/mutations/stream-chat.ts` — replaces `_lib/stream-chat.ts`
- Create: `apps/api-web/src/features/chat/mutations/stream-chat.test.ts`
- Create: `apps/api-web/src/features/tools/capability.ts` — wraps existing `aiTools`
- Modify: `apps/api-web/src/app/(chat)/api/chat/route.ts` — uses registry
- Create: `apps/api-web/src/app/(chat)/api/chat/_lib/registry.ts` — capability registry
- Create: `apps/api-web/src/app/(chat)/api/chat/_lib/default-flow.ts` — global default config
- Delete: `apps/api-web/src/app/(chat)/api/chat/_lib/stream-chat.ts` (after migrating logic)

### Tasks

- [ ] **Step 1.1: Define ChatCapability types**

`apps/api-web/src/features/chat/types.ts`:

```ts
import type { ToolSet, UIMessageStreamWriter } from 'ai'

export interface ChatContext {
  userId?: string
  chatId?: string
  query: string                    // last user message text
  messages: unknown[]              // UI messages, kept generic to avoid coupling
  systemPrompts: string[]
  tools: ToolSet
  metadata: Record<string, unknown>
}

export interface ChatCapability<TConfig = unknown> {
  id: string
  preStream?(ctx: ChatContext, config: TConfig): Promise<ChatContext>
  buildSystemPrompt?(ctx: ChatContext, config: TConfig): Promise<string | null>
  buildTools?(ctx: ChatContext, config: TConfig): ToolSet
  onStreamStart?(writer: UIMessageStreamWriter, ctx: ChatContext, config: TConfig): Promise<void>
}

export interface CapabilityEntry<TConfig = unknown> {
  capability: ChatCapability<TConfig>
  config: TConfig
  enabled: boolean
}

export interface ChatFlow {
  capabilities: CapabilityEntry[]
  agentLoop: { maxSteps: number }
  model?: string                    // optional; falls back to provider default
}
```

- [ ] **Step 1.2: Failing run-capabilities tests**

`apps/api-web/src/features/chat/lib/run-capabilities.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import { runCapabilities } from './run-capabilities'

import type { ChatCapability, ChatContext } from '../types'

const baseCtx: ChatContext = {
  query: 'hi',
  messages: [],
  systemPrompts: [],
  tools: {},
  metadata: {},
}

describe('runCapabilities', () => {
  it('skips disabled capabilities', async () => {
    const preStream = vi.fn(async (ctx) => ctx)
    const cap: ChatCapability = { id: 'x', preStream }

    await runCapabilities([{ capability: cap, config: {}, enabled: false }], baseCtx)

    expect(preStream).not.toHaveBeenCalled()
  })

  it('runs preStream in order and accumulates context', async () => {
    const cap1: ChatCapability = {
      id: 'a',
      preStream: async (ctx) => ({ ...ctx, systemPrompts: [...ctx.systemPrompts, 'A'] }),
    }
    const cap2: ChatCapability = {
      id: 'b',
      preStream: async (ctx) => ({ ...ctx, systemPrompts: [...ctx.systemPrompts, 'B'] }),
    }

    const result = await runCapabilities(
      [{ capability: cap1, config: {}, enabled: true }, { capability: cap2, config: {}, enabled: true }],
      baseCtx,
    )

    expect(result.systemPrompts).toEqual(['A', 'B'])
  })

  it('merges tools from buildTools', async () => {
    const cap: ChatCapability = {
      id: 't',
      buildTools: () => ({ foo: { description: 'f' } } as never),
    }

    const result = await runCapabilities([{ capability: cap, config: {}, enabled: true }], baseCtx)

    expect(result.tools).toHaveProperty('foo')
  })
})
```

- [ ] **Step 1.3: Run, confirm fail**

```bash
pnpm --filter api-web test run-capabilities.test
```

- [ ] **Step 1.4: Implement run-capabilities.ts**

`apps/api-web/src/features/chat/lib/run-capabilities.ts`:

```ts
import type { CapabilityEntry, ChatContext } from '../types'

export async function runCapabilities(
  entries: CapabilityEntry[],
  initialCtx: ChatContext,
): Promise<ChatContext> {
  let ctx = initialCtx

  const active = entries.filter((e) => e.enabled)

  for (const entry of active) {
    if (entry.capability.preStream) {
      ctx = await entry.capability.preStream(ctx, entry.config)
    }
  }

  for (const entry of active) {
    if (entry.capability.buildSystemPrompt) {
      const prompt = await entry.capability.buildSystemPrompt(ctx, entry.config)
      if (prompt) ctx = { ...ctx, systemPrompts: [...ctx.systemPrompts, prompt] }
    }
    if (entry.capability.buildTools) {
      const tools = entry.capability.buildTools(ctx, entry.config)
      ctx = { ...ctx, tools: { ...ctx.tools, ...tools } }
    }
  }

  return ctx
}
```

- [ ] **Step 1.5: Confirm pass**

```bash
pnpm --filter api-web test run-capabilities.test
```

- [ ] **Step 1.6: Build tools capability (the test case)**

`apps/api-web/src/features/tools/capability.ts`:

```ts
import { aiTools } from '@/lib/ai/tools'

import type { ChatCapability } from '@/features/chat/types'

export const capability: ChatCapability = {
  id: 'tools',
  buildTools: () => aiTools,
}
```

- [ ] **Step 1.7: Build registry + default-flow**

`apps/api-web/src/app/(chat)/api/chat/_lib/registry.ts`:

```ts
import { capability as toolsCapability } from '@/features/tools/capability'

import type { ChatCapability } from '@/features/chat/types'

export const registry: Record<string, ChatCapability> = {
  tools: toolsCapability,
}
```

`apps/api-web/src/app/(chat)/api/chat/_lib/default-flow.ts`:

```ts
import type { CapabilityEntry, ChatFlow } from '@/features/chat/types'

import { registry } from './registry'

function entry(id: keyof typeof registry, config: unknown = {}, enabled = true): CapabilityEntry {
  return { capability: registry[id]!, config, enabled }
}

export const DEFAULT_FLOW: ChatFlow = {
  capabilities: [
    entry('tools'),
  ],
  agentLoop: { maxSteps: 5 },
}
```

- [ ] **Step 1.8: Migrate streamChat to feature**

Move the bulk of `app/(chat)/api/chat/_lib/stream-chat.ts` into `apps/api-web/src/features/chat/mutations/stream-chat.ts`. New signature:

```ts
import {
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from 'ai'

import { ensureChat, saveMessages } from '@/db/chat-queries'
import { model as defaultModel } from '@/lib/ai/provider'
import { createEventWriter } from '@/lib/ai/stream-events'
import { runCapabilities } from '../lib/run-capabilities'
import { prepareModelMessages } from '@/app/(chat)/api/chat/_lib/prepare-model-messages'

import type { ChatFlow } from '../types'
import type { AppUIMessage } from '@/lib/ai/stream-events'
import type { UIMessage } from 'ai'

interface StreamChatParams {
  flow: ChatFlow
  messages: UIMessage[]
  query: string
  userId?: string
  chatId?: string
}

export async function streamChat(params: StreamChatParams): Promise<Response> {
  const { flow, messages, query, userId, chatId } = params

  const persisted = userId !== undefined && chatId !== undefined
  let isNewChat = false

  if (persisted) {
    const ensured = await ensureChat(userId, chatId)
    if (!ensured.isNew && ensured.userId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    isNewChat = ensured.isNew

    const lastUser = messages.toReversed().find((m) => m.role === 'user')
    if (lastUser) {
      await saveMessages([{ id: lastUser.id, chatId, role: 'user', parts: lastUser.parts, attachments: [] }])
    }
  }

  const ctx = await runCapabilities(flow.capabilities, {
    userId,
    chatId,
    query,
    messages,
    systemPrompts: [],
    tools: {},
    metadata: {},
  })

  const system = ctx.systemPrompts.join('\n\n') || 'You are a helpful assistant.'

  const stream = createUIMessageStream<AppUIMessage>({
    originalMessages: messages as AppUIMessage[],
    generateId: createIdGenerator({ prefix: 'msg', size: 16 }),
    execute: async ({ writer }) => {
      for (const entry of flow.capabilities.filter((e) => e.enabled)) {
        if (entry.capability.onStreamStart) {
          await entry.capability.onStreamStart(writer, ctx, entry.config)
        }
      }

      const events = createEventWriter(writer)

      const result = streamText({
        model: defaultModel,
        system,
        messages: await prepareModelMessages(messages),
        tools: ctx.tools,
        stopWhen: stepCountIs(flow.agentLoop.maxSteps),
        onFinish: async () => {
          // title generation moved into a future capability; preserved here for parity
          if (persisted && isNewChat && messages.filter((m) => m.role === 'user').length === 1 && query) {
            const { generateChatTitle } = await import('@/app/(chat)/api/chat/actions')
            const title = await generateChatTitle(chatId!, query)
            events.writeChatTitle(title)
          }
        },
      })

      writer.merge(result.toUIMessageStream())
    },
    onFinish: async ({ responseMessage }) => {
      if (persisted) {
        await saveMessages([{
          id: responseMessage.id,
          chatId: chatId!,
          role: responseMessage.role,
          parts: responseMessage.parts,
          attachments: [],
        }])
      }
    },
  })

  return createUIMessageStreamResponse({ stream })
}
```

> [!NOTE]
> Title generation is intentionally left inside `streamChat` for now — it's not capability-shaped (cares about persistence and `isNewChat`). Lifting it to a capability is a future refactor.

- [ ] **Step 1.9: Failing streamChat smoke test**

`apps/api-web/src/features/chat/mutations/stream-chat.test.ts` — minimal coverage for "no capabilities → default system prompt", "tools capability injects tools". Use `vi.mock` for `streamText` to avoid hitting the model.

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('ai', async () => {
  const actual = await vi.importActual<typeof import('ai')>('ai')
  return {
    ...actual,
    streamText: vi.fn(() => ({ toUIMessageStream: () => ({}) })),
  }
})
vi.mock('@/db/chat-queries', () => ({ ensureChat: vi.fn(), saveMessages: vi.fn() }))
vi.mock('@/lib/ai/provider', () => ({ model: 'mock' }))
vi.mock('@/app/(chat)/api/chat/_lib/prepare-model-messages', () => ({
  prepareModelMessages: async (m: unknown) => m,
}))

import { streamChat } from './stream-chat'

import type { ChatFlow } from '../types'

describe('streamChat', () => {
  const baseFlow: ChatFlow = { capabilities: [], agentLoop: { maxSteps: 5 } }

  it('runs without capabilities', async () => {
    const res = await streamChat({
      flow: baseFlow,
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }] as never,
      query: 'hi',
    })

    expect(res).toBeInstanceOf(Response)
  })
})
```

- [ ] **Step 1.10: Confirm tests pass**

```bash
pnpm --filter api-web test stream-chat.test
```

- [ ] **Step 1.11: Rewrite chat route to use registry**

Replace `apps/api-web/src/app/(chat)/api/chat/route.ts`:

```ts
import { checkBotId } from 'botid/server'

import { withAuth } from '@/lib/api/with-auth'
import { withErrorHandler } from '@/lib/api/with-error-handler'
import { streamChat } from '@/features/chat/mutations/stream-chat'
import { ChatError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/ratelimit'

import { bodySchema } from './_lib/validate-request'
import { DEFAULT_FLOW } from './_lib/default-flow'

import type { UIMessage } from 'ai'

export const POST = withErrorHandler(withAuth(async (req, { auth }) => {
  const botResult = await checkBotId()
  if (botResult.isBot && !botResult.isVerifiedBot) {
    return new ChatError('Forbidden', 403).toResponse()
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { allowed } = await checkRateLimit(ip)
  if (!allowed) return new ChatError('Too Many Requests', 429).toResponse()

  const parsed = bodySchema.parse(await req.json())
  const messages = parsed.messages as UIMessage[]
  const query = getLastUserText(messages)

  const isAnonymous = auth.session.user.isAnonymous ?? false
  const userId = isAnonymous ? undefined : auth.session.user.id
  const chatId = isAnonymous ? undefined : parsed.chatId

  return streamChat({ flow: DEFAULT_FLOW, messages, query, userId, chatId })
}))

function getLastUserText(messages: UIMessage[]): string {
  const lastUser = messages.toReversed().find((m) => m.role === 'user')
  const firstText = lastUser?.parts.find((p) => p.type === 'text')
  return firstText && 'text' in firstText ? String(firstText.text) : ''
}
```

> [!NOTE]
> `useRag` is intentionally **not** read here yet — it becomes part of the flow in Phase 3 (the toggle either flips a `CapabilityEntry.enabled` or stays as a body-level override). For now, `bodySchema` keeps the field but it's ignored.

- [ ] **Step 1.12: Delete old stream-chat.ts**

```bash
rm apps/api-web/src/app/\(chat\)/api/chat/_lib/stream-chat.ts
```

- [ ] **Step 1.13: Typecheck + tests + dev smoke**

```bash
pnpm --filter api-web typecheck
pnpm --filter api-web test
pnpm dev
```

Manual: open chat, send a message, confirm tools (e.g., "what time is it?") still work via `getCurrentTime`.

- [ ] **Step 1.14: Commit**

```bash
git add apps/api-web/src/features/chat \
        apps/api-web/src/features/tools \
        apps/api-web/src/app/\(chat\)/api/chat/route.ts \
        apps/api-web/src/app/\(chat\)/api/chat/_lib/
git rm apps/api-web/src/app/\(chat\)/api/chat/_lib/stream-chat.ts 2>/dev/null || true
git commit -m "refactor(chat): introduce capability slot architecture, migrate tools as first capability"
```

---

## Phase 2 — Schema + chunk primitives [Locked]

**Why now:** Architecture-independent. Lays the data foundation for Phases 3, 5, 6.

### Files

- Create: `apps/api-web/src/lib/rag/types.ts`
- Modify: `apps/api-web/src/lib/rag/chunk.ts`
- Create: `apps/api-web/src/lib/rag/chunk.test.ts`
- Modify: `apps/api-web/src/db/schema.ts:152-182`

### Schema additions

`ragDocument` adds:

- `rawContent: text` (nullable)
- `chunkConfig: jsonb` default `{ strategy: 'fixed', size: 512, overlap: 64 }`

`ragChunk` adds:

- `charStart: integer not null`
- `charEnd: integer not null`
- `enabled: boolean not null default true`
- `editedContent: text` (nullable)
- `tokenCount: integer not null`

### Tasks

- [ ] **Step 2.1: Define types**

`apps/api-web/src/lib/rag/types.ts`:

```ts
export interface Chunk {
  content: string
  charStart: number
  charEnd: number
  tokenCount: number
}

export interface ChunkConfig {
  strategy: 'fixed' | 'semantic'
  size: number
  overlap: number
}
```

- [ ] **Step 2.2: Update Drizzle schema**

Edit `apps/api-web/src/db/schema.ts` — add `boolean, jsonb` to `drizzle-orm/pg-core` imports, add `import type { ChunkConfig } from '@/lib/rag/types'`, replace tables:

```ts
export const ragDocument = pgTable('rag_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  status: varchar('status', { enum: ['pending', 'processing', 'ready', 'error'] }).default('pending').notNull(),
  errorMessage: text('error_message'),
  rawContent: text('raw_content'),
  chunkConfig: jsonb('chunk_config').$type<ChunkConfig>().default({ strategy: 'fixed', size: 512, overlap: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const ragChunk = pgTable('rag_chunk', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => ragDocument.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  editedContent: text('edited_content'),
  embedding: vector('embedding', { dimensions: 1536 }),
  chunkIndex: integer('chunk_index').notNull(),
  charStart: integer('char_start').notNull(),
  charEnd: integer('char_end').notNull(),
  tokenCount: integer('token_count').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('rag_chunk_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
])
```

- [ ] **Step 2.3: db:push, truncate legacy**

```bash
pnpm --filter api-web db:push
```

Choose **truncate** when Drizzle prompts about not-null columns on `rag_chunk`. `rag_document.raw_content/chunk_config` are nullable / defaulted so no truncation.

- [ ] **Step 2.4: Failing chunk.ts tests**

`apps/api-web/src/lib/rag/chunk.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { chunkText } from './chunk'

describe('chunkText (fixed)', () => {
  const cfg = { strategy: 'fixed', size: 5, overlap: 1 } as const

  it('content slices back from offsets', () => {
    const text = 'one two three four five six seven eight nine ten'
    const chunks = chunkText(text, cfg)
    for (const c of chunks) {
      expect(text.slice(c.charStart, c.charEnd)).toBe(c.content)
    }
  })

  it('covers full text', () => {
    const text = 'a b c d e f g h i j'
    const chunks = chunkText(text, cfg)
    expect(chunks[0]!.charStart).toBe(0)
    expect(chunks.at(-1)!.charEnd).toBe(text.length)
  })

  it('reports positive token count', () => {
    const chunks = chunkText('hello world this is a test sentence', cfg)
    for (const c of chunks) expect(c.tokenCount).toBeGreaterThan(0)
  })

  it('empty input → empty array', () => {
    expect(chunkText('', cfg)).toEqual([])
  })
})

describe('chunkText (semantic)', () => {
  it('throws not-implemented', () => {
    expect(() => chunkText('hi', { strategy: 'semantic', size: 5, overlap: 1 }))
      .toThrow(/not implemented/i)
  })
})
```

- [ ] **Step 2.5: Run, confirm fail**

```bash
pnpm --filter api-web test chunk.test
```

- [ ] **Step 2.6: Reimplement chunk.ts**

`apps/api-web/src/lib/rag/chunk.ts`:

```ts
import type { Chunk, ChunkConfig } from './types'

export function chunkText(text: string, config: ChunkConfig): Chunk[] {
  if (!text.trim()) return []
  if (config.strategy === 'semantic') {
    throw new Error('semantic strategy not implemented yet')
  }
  return chunkFixed(text, config.size, config.overlap)
}

function chunkFixed(text: string, size: number, overlap: number): Chunk[] {
  const tokens: { word: string, charStart: number, charEnd: number }[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0], charStart: m.index, charEnd: m.index + m[0].length })
  }
  if (tokens.length === 0) return []

  const chunks: Chunk[] = []
  const stride = Math.max(1, size - overlap)
  for (let start = 0; start < tokens.length; start += stride) {
    const end = Math.min(start + size, tokens.length)
    const slice = tokens.slice(start, end)
    const charStart = slice[0]!.charStart
    const charEnd = slice.at(-1)!.charEnd
    const content = text.slice(charStart, charEnd)
    chunks.push({
      content,
      charStart,
      charEnd,
      tokenCount: Math.ceil(content.length / 4),
    })
    if (end === tokens.length) break
  }
  return chunks
}
```

- [ ] **Step 2.7: Confirm pass + typecheck**

```bash
pnpm --filter api-web test chunk.test
pnpm --filter api-web typecheck
```

> [!WARNING]
> Typecheck will fail in `app/(rag)/api/rag/ingest/[id]/route.ts` and `db/rag-queries.ts` (callers using old shapes). These are fixed in Phase 3 — temporarily acceptable to commit Phase 2 with a typecheck failure if you communicate it in commit message, **or** bundle Phase 2 into Phase 3's commit.

- [ ] **Step 2.8: Commit**

```bash
git add apps/api-web/src/lib/rag/types.ts \
        apps/api-web/src/lib/rag/chunk.ts \
        apps/api-web/src/lib/rag/chunk.test.ts \
        apps/api-web/src/db/schema.ts
git commit -m "feat(rag): add char offsets, raw content, edit fields + chunk types"
```

---

## Phase 3 — RAG capability [Locked]

**Why now:** Tests the capability architecture against a real, non-trivial use case. Replaces the `useRag` boolean with a proper capability that exposes config (topK, threshold, etc.).

### Files

**Create:**

- `apps/api-web/src/features/rag/lib/validators.ts` — Zod schemas
- `apps/api-web/src/features/rag/queries/search-similar-chunks.ts` + `.test.ts`
- `apps/api-web/src/features/rag/queries/retrieve-rag-context.ts` + `.test.ts`
- `apps/api-web/src/features/rag/queries/types.ts` — `RetrievedChunk`, `RagContext`, `RagConfig`
- `apps/api-web/src/features/rag/mutations/ingest-document.ts` + `.test.ts`
- `apps/api-web/src/features/rag/capability.ts`
- `apps/api-web/src/features/rag/capability.test.ts`

**Delete:**

- `apps/api-web/src/db/rag-queries.ts`
- `apps/api-web/src/lib/rag/retrieve.ts`

**Modify:**

- `apps/api-web/src/app/(rag)/api/rag/ingest/[id]/route.ts` — thin handler
- `apps/api-web/src/app/(rag)/api/rag/documents/route.ts` — thin handler using HOFs
- `apps/api-web/src/app/(rag)/api/rag/documents/[id]/route.ts` — thin handler using HOFs
- `apps/api-web/src/app/(chat)/api/chat/_lib/registry.ts` — add `rag`
- `apps/api-web/src/app/(chat)/api/chat/_lib/default-flow.ts` — add rag entry
- `apps/api-web/src/app/(chat)/api/chat/_lib/validate-request.ts` — body still accepts `useRag`, mapped to flow override

### Key types

`apps/api-web/src/features/rag/queries/types.ts`:

```ts
export interface RetrievedChunk {
  marker: string                    // 'c1', 'c2', ...
  chunkId: string
  documentId: string
  documentName: string
  content: string
  charStart: number
  charEnd: number
  similarity: number
}

export interface RagContext {
  system: string                    // formatted system prompt with [^cN] markers
  sources: RetrievedChunk[]
}

export interface RagConfig {
  topK: number                      // default 5
  similarityThreshold: number       // default 0.5
}
```

### RagCapability shape

`apps/api-web/src/features/rag/capability.ts`:

```ts
import type { ChatCapability } from '@/features/chat/types'

import { retrieveRagContext } from './queries/retrieve-rag-context'

import type { RagConfig } from './queries/types'

export const capability: ChatCapability<RagConfig> = {
  id: 'rag',

  async preStream(ctx, config) {
    if (!ctx.userId) return ctx                              // no RAG for anonymous
    const rag = await retrieveRagContext(ctx.query, ctx.userId, config)
    return { ...ctx, metadata: { ...ctx.metadata, rag } }
  },

  async buildSystemPrompt(ctx) {
    const rag = ctx.metadata.rag as { system: string } | undefined
    return rag?.system ?? null
  },

  async onStreamStart(writer, ctx) {
    const rag = ctx.metadata.rag as { sources: unknown[] } | undefined
    if (rag && rag.sources.length > 0) {
      writer.write({ type: 'data-rag-sources' as const, data: rag.sources } as never)
    }
  },
}
```

> [!NOTE]
> The marker convention `[^cN]` in the system prompt instructs the model to cite chunks. Phase 4 frontend converts these markers to `<InlineCitation>`. Empty sources → no system prompt added (capability returns null), so chat falls back to the default.

### Tasks (overview — full TDD breakdown identical pattern to Phase 1)

- [ ] **3.1** Define types (`features/rag/queries/types.ts`, `features/rag/lib/validators.ts`)
- [ ] **3.2** Move `searchSimilarChunks` from `db/rag-queries.ts` to `features/rag/queries/search-similar-chunks.ts`. Expand return shape to `RetrievedChunk` minus `marker`. Add `enabled = true` filter, `COALESCE(editedContent, content)`. Mock `db` in tests.
- [ ] **3.3** Build `retrieveRagContext(query, userId, config)`: embed query → search → format system prompt with `[^cN]` markers → return `{ system, sources }` (with markers populated). Empty sources → return `{ system: '', sources: [] }` so capability returns null prompt.
- [ ] **3.4** Move ingest logic to `features/rag/mutations/ingest-document.ts`. Pure function: input `{ documentId, content, mimeType }`, performs chunk + embed + insert. Status updates handled inside.
- [ ] **3.5** Rewrite `app/(rag)/api/rag/ingest/[id]/route.ts` as thin HOF handler calling `ingestDocument`. Drop the `fetch` self-call hack — caller (documents POST) does `void ingestDocument(...)`.
- [ ] **3.6** Rewrite `app/(rag)/api/rag/documents/route.ts` (GET list, POST upload) and `[id]/route.ts` (DELETE) using `withErrorHandler(withAuth(...))`. Replace direct `db` calls with `features/rag/queries/list-documents.ts` + `features/rag/mutations/{create-document, delete-document}.ts` (3 small files).
- [ ] **3.7** Build `features/rag/capability.ts` exactly as shown above. Test: mock `retrieveRagContext`, assert `preStream` populates metadata, `buildSystemPrompt` returns it, `onStreamStart` writes the sources part.
- [ ] **3.8** Update registry + default-flow:

```ts
// _lib/registry.ts adds:
import { capability as ragCapability } from '@/features/rag/capability'
export const registry = { tools: toolsCapability, rag: ragCapability }

// _lib/default-flow.ts adds:
entry('rag', { topK: 5, similarityThreshold: 0.5 } satisfies RagConfig)
```

- [ ] **3.9** Update body schema + chat route: `useRag` body field becomes a per-request override that flips `rag` capability `enabled`. If you want to keep current UX (toggle in UI) — yes; if you want capability config to be fully server-side — drop the body field. **Default:** keep the body override for UX continuity:

```ts
// in route handler, after parsing:
const flow = parsed.useRag === false
  ? { ...DEFAULT_FLOW, capabilities: DEFAULT_FLOW.capabilities.map((e) =>
      e.capability.id === 'rag' ? { ...e, enabled: false } : e) }
  : DEFAULT_FLOW
```

- [ ] **3.10** Delete `db/rag-queries.ts` and `lib/rag/retrieve.ts`. Verify with grep:

```bash
grep -r "from '@/db/rag-queries'" apps/api-web/src && exit 1 || echo OK
grep -r "from '@/lib/rag/retrieve'" apps/api-web/src && exit 1 || echo OK
```

- [ ] **3.11** Register `data-rag-sources` part in `lib/ai/stream-events.ts` so `AppUIMessage` types include it.
- [ ] **3.12** Typecheck + tests + manual smoke (upload doc, ask question, see context-aware answer).
- [ ] **3.13** Commit:

```bash
git commit -m "feat(rag): implement as ChatCapability, migrate from useRag boolean"
```

### Acceptance criteria

- `pnpm --filter api-web typecheck` passes
- `pnpm --filter api-web test` all green
- `grep -r "import.*db/rag-queries" apps/api-web/src` returns nothing
- `grep -r "import.*lib/rag/retrieve" apps/api-web/src` returns nothing
- Manual: chat with `useRag = true` returns context-aware answer; `useRag = false` returns plain answer
- Stream contains `data-rag-sources` part with retrieved chunk metadata when RAG active

---

## Phase 4 — Citation UI with ai-elements [Spec]

### Approach

Two visual treatments combined per assistant message:

1. **Top of message: `<Sources>`** — collapsible list of all retrieved chunks (RAGFlow-style "see what was used")
2. **Inside message text: `<InlineCitation>`** — hoverable pills replacing `[^cN]` markers in the streamed text

### Setup

```bash
cd apps/api-web && pnpm dlx ai-elements@latest add sources inline-citation
```

This creates `apps/api-web/src/components/ai-elements/{sources,inline-citation}.tsx`.

### Source data flow

- Phase 3 already writes `data-rag-sources` part on stream start
- Frontend reads from `message.parts.filter((p) => p.type === 'data-rag-sources')`
- Each part has `data: RetrievedChunk[]`

### Marker rendering

Per the inline-citation docs: streamdown can't natively convert `[^cN]` to citations. Since Phase 3 prompts the model to emit `[^c1]`, `[^c2]` markers literally in the text, the frontend renders text via:

```tsx
function renderTextWithCitations(text: string, sources: RetrievedChunk[]) {
  const parts = text.split(/(\[\^c\d+\])/)
  return parts.map((part, i) => {
    const m = part.match(/\[\^c(\d+)\]/)
    if (!m) return <Streamdown key={i}>{part}</Streamdown>
    const source = sources.find((s) => s.marker === `c${m[1]}`)
    if (!source) return <span key={i}>{part}</span>          // hallucinated marker → plain text

    return (
      <InlineCitation key={i}>
        <InlineCitationCard>
          <InlineCitationCardTrigger sources={[source.documentName]} />
          <InlineCitationCardBody>
            <InlineCitationSource
              title={source.documentName}
              url={`/rag/${source.documentId}?highlight=${source.chunkId}`}
            />
            <InlineCitationQuote>{source.content}</InlineCitationQuote>
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
    )
  })
}
```

> [!WARNING]
> Splitting streamdown content this way breaks markdown rendering across boundaries (e.g., a marker inside a list). Acceptable v1 limitation. Document it. Future work: contribute a streamdown remark plugin upstream.

### Files

- Modify: `apps/api-web/src/components/ai-elements/message.tsx` (locate exact path during execution)
- Create: `apps/api-web/src/features/chat/components/sources-list.tsx` — wraps `<Sources>` with retrieved chunk data
- Create: `apps/api-web/src/features/chat/components/inline-citations.tsx` — text+citation renderer

### Acceptance criteria

- Each assistant message with retrieved sources shows `<Sources>` collapsed by default with count
- In-text `[^cN]` markers replaced with hover citation pills
- Hover reveals chunk content, document name, similarity-as-percentage
- "View source" link navigates to `/rag/[documentId]?highlight=[chunkId]` (Phase 6 implements that page)
- Hallucinated `[^c99]` (no matching source) renders as plain text, never broken UI
- Disabling all RAG sources (Phase 5 toggle) → next message has no `<Sources>` bar

### Open questions

- Numeric markers `[1]` vs prefixed `[^c1]`? Numeric is more natural to model. **Default:** use `[1]`-style; adjust system prompt and split regex accordingly
- Group consecutive markers visually? **Default:** ai-elements `InlineCitation` doesn't auto-group; revisit if cluster looks ugly

---

## Phase 5 — Chunk management API [Spec]

Endpoints powering Phase 6's preview UI.

### Endpoints

- `GET /api/rag/documents/[id]/chunks/route.ts`
  - Calls `features/rag/queries/get-document-chunks.ts`
  - Returns `Chunk[]` + ownership-enforced

- `PATCH /api/rag/chunks/[id]/route.ts`
  - Body: `features/rag/lib/validators.ts:updateChunkSchema` — `{ enabled?, editedContent? }`
  - Calls `features/rag/mutations/update-chunk.ts`
  - Re-embeds if `editedContent` changed

- `POST /api/rag/documents/[id]/rechunk/route.ts`
  - Body: `ChunkConfig`
  - Calls `features/rag/mutations/rechunk-document.ts`
  - 409 if `rawContent` is null

### Acceptance criteria

- All endpoints: 401 unauth, 404 cross-user, 400 invalid body
- Toggle round-trip < 100ms (no embed)
- Edit re-embed < 2s
- Re-chunk on 50KB doc < 10s
- Vitest coverage for ownership + re-embed correctness

### Open questions

- Single-chunk PATCH vs batch? **Default:** single only
- Async re-chunk for large docs? **Default:** sync until > 100KB common

---

## Phase 6 — Chunk preview page UI [Spec]

### Route

`apps/api-web/src/app/(dashboard)/rag/[documentId]/page.tsx` (server component fetches doc) + `features/rag/components/chunk-editor.tsx` (client).

### Layout

Two-pane:

- **Left (60%)**: rawContent with `<span data-chunk-id>` ranges. Hover sync. `?highlight=` scrolls + flashes
- **Right (40%)**: virtualized chunk list (`@tanstack/react-virtual`). Per-row: index, token count, enabled switch, content (collapsible), Edit/Save/Reset. Toolbar: strategy + size/overlap + Re-chunk (confirm)

### Interaction

- Edits local until Save → `PATCH /chunks/[id]`
- Toggle immediate (optimistic React Query)
- Re-chunk: confirm dialog → pending state on right pane → refetch chunks

### Acceptance criteria

- Hover sync OK on 500-chunk doc
- `?highlight` scroll + flash within 500ms of mount
- Disable chunk → excluded from chat retrieval next request
- Edit chunk → reflected in subsequent answer (re-embed verified)

### Open questions

- Drag merge/split chunks? **Default:** v1 ships without
- Diff view for `editedContent`? **Default:** v1 just shows current + reset

---

## Out of Scope

Explicit non-goals — separate plans:

- Hybrid search (vector + BM25)
- Reranker integration (Cohere/Jina)
- PDF/DOCX deep parsing (LlamaParse/Mistral OCR)
- Async ingest queue (Inngest)
- Multi-tenant org features
- Migrating legacy `(rag)`/`(chat)` route groups into `(dashboard)`
- Per-user / per-session capability config (UI editor)
- Visual workflow canvas with `Canvas`/`Node`/`Edge` (Dify-style editor)
- Title generation as a capability (currently inlined in `streamChat`)
- Web-search capability, memory capability, custom-agent capability — separate plans, identical pattern to RAG

---

## Self-review

- **Spec coverage:** chat capability slot (Q1) ✓, global default config (Q2 = a) ✓, ai-elements UI (Q3) ✓; RAG goals (preview, HITL, citation, jump) all map to phases
- **Type consistency:** `Chunk`/`ChunkConfig` in `lib/rag/types.ts`. `RetrievedChunk`/`RagContext`/`RagConfig` in `features/rag/queries/types.ts`. `ChatCapability`/`ChatContext`/`ChatFlow`/`CapabilityEntry` in `features/chat/types.ts`. Cross-feature imports are type-only per rule update
- **Architecture compliance:** every route uses `withErrorHandler(withAuth(...))`. Feature business logic is pure functions. `features/chat` knows zero RAG. Capability registry assembled in `app/`. No feature imports another feature's runtime code
- **ai-elements usage:** `Sources` + `InlineCitation` for citation UI. `Canvas` not used in this plan (canvas editor out of scope). `Agent` not used (admin UI out of scope)
- **Placeholders:** Phases 0-3 are fully spelled out. Phases 4-6 are specs with explicit "deferred to subagent execution" notes

---

## Execution

Phases 0 → 1 → 2 → 3 are the locked critical path. After Phase 3 lands and capability architecture is observable, Phases 4–6 can be expanded into TDD task lists or run in parallel.

Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per phase, two-stage review
2. **Inline Execution** — execute Phases 0 → 3 in current session with checkpoints
