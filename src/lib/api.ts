import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PermissionError } from "@/lib/rbac";
import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// Shared API utilities for route handlers
// ─────────────────────────────────────────────────────────────────────────────

export type ApiHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Standard API success response
 */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Standard API error response
 */
export function err(message: string, status = 400, details?: unknown): NextResponse {
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
}

/**
 * Get the authenticated session, throw 401 if not authenticated.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError("Unauthorized", 401);
  }
  return session as typeof session & { user: NonNullable<typeof session.user> & { id: string } };
}

/**
 * Get the tenant context from the authenticated user.
 * Verifies the user has the given permission within the tenant.
 */
export async function requireTenantAccess(userId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { ownerId: userId, isActive: true },
    select: {
      id: true,
      plan: true,
      siteSlug: true,
      userRoles: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!tenant) throw new ApiError("Tenant not found", 404);

  const role = tenant.userRoles[0]?.role ?? "OWNER";
  return { tenantId: tenant.id, plan: tenant.plan, role };
}

/**
 * Wrap a route handler with standard error handling.
 */
export function withErrorHandler(handler: any): any {
  return async (req: NextRequest, context: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return err(error.message, error.status);
      }
      if (error instanceof PermissionError) {
        return err(error.message, 403);
      }
      console.error("[API Error]", error);
      return err("Internal server error", 500);
    }
  };
}

/**
 * Parse and validate request body with a Zod schema.
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }

  try {
    return schema.parse(body);
  } catch (error: unknown) {
    const zodError = error as { errors?: unknown[] };
    throw new ApiError("Validation failed", 422, zodError.errors);
  }
}

/**
 * Generate a URL-safe slug from a string.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Ensure a slug is unique within a tenant for a given model.
 */
export async function ensureUniqueSlug(
  tenantId: string,
  slug: string,
  model: "project" | "blogPost" | "openSourceProject" | "service",
  excludeId?: string
): Promise<string> {
  let candidate = slug;
  let attempt = 0;

  while (true) {
    const where = excludeId
      ? { tenantId, slug: candidate, id: { not: excludeId } }
      : { tenantId, slug: candidate };

    let existing: unknown;
    if (model === "project") {
      existing = await prisma.project.findFirst({ where });
    } else if (model === "blogPost") {
      existing = await prisma.blogPost.findFirst({ where });
    } else if (model === "openSourceProject") {
      existing = await prisma.openSourceProject.findFirst({ where });
    } else {
      existing = await prisma.service.findFirst({ where });
    }

    if (!existing) return candidate;

    attempt++;
    candidate = `${slug}-${attempt}`;
  }
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}
