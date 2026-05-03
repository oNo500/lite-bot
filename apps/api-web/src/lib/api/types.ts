import type { auth } from "@/lib/auth";

type SessionFromAuth = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export interface AuthedContext {
  session: SessionFromAuth;
}

export type RouteHandler<TParams = unknown> = (
  req: Request,
  context: { params: Promise<TParams> },
) => Promise<Response>;

export type AuthedRouteHandler<TParams = unknown> = (
  req: Request,
  context: { params: Promise<TParams>; auth: AuthedContext },
) => Promise<Response>;
