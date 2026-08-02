import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  category: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  excerpt: z.string().max(300).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional().or(z.literal("")),
  readingTime: z.number().int().positive().nullable().optional(),
  scheduledAt: z.string().datetime().optional().or(z.literal("")),
  publishedAt: z.string().datetime().optional().or(z.literal("")),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
  metaKeywords: z.string().optional(),
});

async function getTenantPost(userId: string, postId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!tenant) return null;

  const post = await prisma.blogPost.findUnique({
    where: { id: postId, tenantId: tenant.id },
  });
  return { tenant, post };
}

// ─── GET /api/blog/[id] ─────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getTenantPost(session.user.id, id);

  if (!result || !result.post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.post);
}

// ─── PATCH /api/blog/[id] ───────────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getTenantPost(session.user.id, id);
  if (!result || !result.post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { scheduledAt, publishedAt, featuredImage, ...rest } = parsed.data;

  // Check slug uniqueness if changing slug
  if (rest.slug && rest.slug !== result.post.slug) {
    const existing = await prisma.blogPost.findUnique({
      where: { tenantId_slug: { tenantId: result.tenant.id, slug: rest.slug } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists." }, { status: 409 });
    }
  }

  const updated = await prisma.blogPost.update({
    where: { id },
    data: {
      ...rest,
      ...(featuredImage !== undefined ? { featuredImage: featuredImage || null } : {}),
      ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
      ...(publishedAt !== undefined ? { publishedAt: publishedAt ? new Date(publishedAt) : null } : {}),
    },
    select: { id: true, slug: true, status: true },
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/blog/[id] ──────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getTenantPost(session.user.id, id);
  if (!result || !result.post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ message: "Post deleted." });
}
