import { NextRequest } from "next/server";
import { generatePresignedUploadUrl } from "@/lib/s3";
import { ok, err, requireAuth, requireTenantAccess, withErrorHandler, parseBody } from "@/lib/api";
import { uploadPresignSchema } from "@/lib/validators";

// POST /api/upload/presign — Generate a presigned S3 PUT URL
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId } = await requireTenantAccess(session.user.id);

  const body = await parseBody(req, uploadPresignSchema);

  try {
    const result = await generatePresignedUploadUrl({
      tenantId,
      folder: body.folder,
      fileName: body.fileName,
      fileType: body.fileType,
      fileSize: body.fileSize,
    });

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(error.message, 400);
    }
    throw error;
  }
});
