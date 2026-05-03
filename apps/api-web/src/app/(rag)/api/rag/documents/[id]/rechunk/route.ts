import { documentIdParamsSchema, rechunkConfigSchema } from "@/features/rag/lib/validators";
import { rechunkDocument } from "@/features/rag/mutations/rechunk-document";
import { withAuth } from "@/lib/api/with-auth";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const POST = withErrorHandler(
  withAuth<{ id: string }>(async (req, { params, auth }) => {
    const { id } = documentIdParamsSchema.parse(await params);
    const config = rechunkConfigSchema.parse(await req.json());

    const result = await rechunkDocument({
      documentId: id,
      userId: auth.session.user.id,
      config,
    });

    if (!result.ok) {
      if (result.reason === "not-found") {
        return Response.json({ error: "Not Found" }, { status: 404 });
      }
      if (result.reason === "no-raw-content") {
        return Response.json(
          { error: "Document has no raw content available for re-chunking" },
          { status: 409 },
        );
      }
    }

    return Response.json({ ok: true });
  }),
);
