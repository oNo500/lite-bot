import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { appPaths } from "@/config/app-paths";
import { ChunkEditor } from "@/features/rag/components/chunk-editor";
import { auth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function Page({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { documentId } = await params;

  if (!session) {
    redirect(appPaths.auth.guest.getHref(appPaths.rag.detail.href(documentId)));
  }

  return <ChunkEditor documentId={documentId} />;
}
