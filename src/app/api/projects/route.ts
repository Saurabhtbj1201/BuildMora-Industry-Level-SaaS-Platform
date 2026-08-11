import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  ok, err, requireAuth, requireTenantAccess,
  withErrorHandler, parseBody, generateSlug, ensureUniqueSlug
} from "@/lib/api";
import { hasPermission } from "@/lib/rbac";
import { projectSchema } from "@/lib/validators";

export const dynamic = 'force-dynamic';

// GET /api/projects — List all projects for the authenticated tenant
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId } = await requireTenantAccess(session.user.id);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    ...(status ? { status: status as "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "ARCHIVED" } : {}),
    ...(category ? { category } : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        status: true,
        startDate: true,
        isPublished: true,
        starsRating: true,
        techStack: true,
        viewCount: true,
        images: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.project.count({ where }),
  ]);

  return ok({ projects, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// POST /api/projects — Create a new project
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId, role } = await requireTenantAccess(session.user.id);

  if (!hasPermission(role, "projects:write")) {
    return err("Insufficient permissions", 403);
  }

  const body = await parseBody(req, projectSchema);

  // Auto-generate slug if not provided or ensure uniqueness
  const baseSlug = body.slug || generateSlug(body.title);
  const slug = await ensureUniqueSlug(tenantId, baseSlug, "project");

  const project = await prisma.project.create({
    data: {
      tenantId,
      title: body.title,
      slug,
      category: body.category,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      description: body.description,
      liveLink: body.liveLink,
      githubLink: body.githubLink,
      customLinks: body.customLinks ? JSON.parse(JSON.stringify(body.customLinks)) : undefined,
      starsRating: body.starsRating,
      techStack: body.techStack ?? [],
      contributors: body.contributors ? JSON.parse(JSON.stringify(body.contributors)) : undefined,
      images: body.images ?? [],
      ogImage: body.ogImage,
      ogTitle: body.ogTitle,
      ogDescription: body.ogDescription,
      metaKeywords: body.metaKeywords,
      isPublished: body.isPublished ?? false,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      tenantId,
      action: "project.created",
      entity: "Project",
      entityId: project.id,
      newValue: { title: project.title, slug: project.slug },
    },
  });

  return ok(project, 201);
});
