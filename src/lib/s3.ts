import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME ?? "buildmora-assets";
const CDN_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN;
const PRESIGN_EXPIRY = 15 * 60; // 15 minutes

// ─── Allowed MIME types ───────────────────────────────────────────────────────
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

// Max upload sizes by folder type (bytes)
const MAX_SIZES: Record<string, number> = {
  "profile": 5 * 1024 * 1024,      // 5MB
  "projects": 10 * 1024 * 1024,    // 10MB
  "open-source": 10 * 1024 * 1024, // 10MB
  "blog": 10 * 1024 * 1024,        // 10MB
  "services": 10 * 1024 * 1024,    // 10MB
  "og": 2 * 1024 * 1024,           // 2MB
  "platform": 20 * 1024 * 1024,    // 20MB (admin)
};

// ─────────────────────────────────────────────────────────────────────────────

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Generate a presigned PUT URL for direct browser → S3 upload.
 * The key is tenant-scoped to enforce isolation.
 */
export async function generatePresignedUploadUrl(params: {
  tenantId: string;
  folder: string;  // e.g. "projects", "blog", "profile"
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<PresignedUploadResult> {
  const { tenantId, folder, fileName, fileType, fileSize } = params;

  // Validate MIME type
  if (!ALLOWED_TYPES.has(fileType)) {
    throw new Error(`File type '${fileType}' is not allowed`);
  }

  // Validate file size
  const maxSize = MAX_SIZES[folder] ?? 5 * 1024 * 1024;
  if (fileSize > maxSize) {
    throw new Error(
      `File size exceeds limit of ${maxSize / 1024 / 1024}MB for ${folder}`
    );
  }

  // Generate a safe key
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const uuid = randomUUID();
  const key = `tenants/${tenantId}/${folder}/${uuid}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
    // Server-side encryption
    ServerSideEncryption: "AES256",
    // Metadata
    Metadata: {
      "tenant-id": tenantId,
      "original-name": encodeURIComponent(fileName),
    },
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: PRESIGN_EXPIRY,
  });

  const publicUrl = CDN_DOMAIN
    ? `https://${CDN_DOMAIN}/${key}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl, key };
}

/**
 * Delete an object from S3. Always verify tenantId matches key prefix.
 */
export async function deleteS3Object(key: string, tenantId: string) {
  // Security: ensure key belongs to this tenant
  if (!key.startsWith(`tenants/${tenantId}/`) && !key.startsWith("platform/")) {
    throw new Error("Unauthorized: key does not belong to tenant");
  }

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Get a public URL for an S3 key (CloudFront CDN or direct S3).
 */
export function getPublicUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key; // already a full URL

  return CDN_DOMAIN
    ? `https://${CDN_DOMAIN}/${key}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
