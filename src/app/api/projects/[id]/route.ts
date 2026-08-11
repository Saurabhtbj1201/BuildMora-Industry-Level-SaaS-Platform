import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  ok, err, requireAuth, requireTenantAccess,
  withErrorHandler, parseBody, generateSlug, ensureUniqueSlug
} from "@/lib/api";
import { hasPermission } from "@/lib/rbac";
import { projectSchema } from "@/lib/validators";

export const dynamic = 'force-dynamic';

// GET /api/projects/[id] — Fetch single project
export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireAuth();
  const { tenantId } = await requireTenantAccess(session.user.id);

  const project = await prisma.project.findFirst({
    where: { id, tenantId },
  });

  if (!project) return err("Project not found", 404);

  return ok(project);
});

// PUT /api/projects/[id] — Update existing project
export const PUT = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireAuth();
  const { tenantId, role } = await requireTenantAccess(session.user.id);

  if (!hasPermission(role, "projects:write")) {
    return err("Insufficient permissions", 403);
  }

  const existing = await prisma.project.findFirst({
    where: { id, tenantId },
  });

  if (!existing) return err("Project not found", 404);

  const body = await parseBody(req, projectSchema.partial());

  // Slug check if changed
  let slug = existing.slug;
  if (body.slug && body.slug !== existing.slug) {
    slug = await ensureUniqueSlug(tenantId, generateSlug(body.slug), "project", id);
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      slug,
      ...(body.category !== undefined && { category: body.category }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.liveLink !== undefined && { liveLink: body.liveLink }),
      ...(body.githubLink !== undefined && { githubLink: body.githubLink }),
      ...(body.customLinks !== undefined && { customLinks: JSON.parse(JSON.stringify(body.customLinks)) }),
      ...(body.starsRating !== undefined && { starsRating: body.starsRating }),
      ...(body.techStack !== undefined && { techStack: body.techStack }),
      ...(body.contributors !== undefined && { contributors: JSON.parse(JSON.stringify(body.contributors)) }),
      ...(body.images !== undefined && { images: body.images }),
      ...(body.ogImage !== undefined && { ogImage: body.ogImage }),
      ...(body.ogTitle !== undefined && { ogTitle: body.ogTitle }),
      ...(body.ogDescription !== undefined && { ogDescription: body.ogDescription }),
      ...(body.metaKeywords !== undefined && { metaKeywords: body.metaKeywords }),
      ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    },
  });

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      tenantId,
      action: "project.updated",
      entity: "Project",
      entityId: project.id,
      oldValue: { title: existing.title, isPublished: existing.isPublished },
      newValue: { title: project.title, isPublished: project.isPublished },
    },
  });

  return ok(project);
});

// DELETE /api/projects/[id] — Delete project
export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireAuth();
  const { tenantId, role } = await requireTenantAccess(session.user.id);

  if (!hasPermission(role, "projects:delete")) {
    return err("Insufficient permissions", 403);
  }

  const existing = await prisma.project.findFirst({
    where: { id, tenantId },
  });

  if (!existing) return err("Project not found", 404);

  await prisma.project.delete({ where: { id } });

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      tenantId,
      action: "project.deleted",
      entity: "Project",
      entityId: id,
      oldValue: { title: existing.title },
    },
  });

  return ok({ deleted: true });
});
