import { documentIdParamsSchema } from "@/features/rag/lib/validators";
import { getDocumentChunks } from "@/features/rag/queries/get-document-chunks";
import { withAuth } from "@/lib/api/with-auth";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const GET = withErrorHandler(
  withAuth<{ id: string }>(async (_req, { params, auth }) => {
    const { id } = documentIdParamsSchema.parse(await params);
    const result = await getDocumentChunks(id, auth.session.user.id);

    if (!result) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }

    return Response.json(result);
  }),
);
