import { documentIdParamsSchema } from "@/features/rag/lib/validators";
import { deleteDocument } from "@/features/rag/mutations/delete-document";
import { withAuth } from "@/lib/api/with-auth";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const DELETE = withErrorHandler(
  withAuth<{ id: string }>(async (_req, { params, auth }) => {
    const { id } = documentIdParamsSchema.parse(await params);
    const deleted = await deleteDocument(id, auth.session.user.id);

    if (!deleted) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  }),
);
