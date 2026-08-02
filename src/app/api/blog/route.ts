import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  category: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).default("DRAFT"),
  excerpt: z.string().max(300).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featuredImage: z.string().url().optional().or(z.literal("")),
  readingTime: z.number().int().positive().nullable().optional(),
  scheduledAt: z.string().datetime().optional().or(z.literal("")),
  publishedAt: z.string().datetime().optional().or(z.literal("")),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
  metaKeywords: z.string().optional(),
});

// ─── GET /api/blog — list all posts for current tenant ─────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const posts = await prisma.blogPost.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, status: true,
      publishedAt: true, viewCount: true, createdAt: true,
    },
  });

  return NextResponse.json({ posts });
}

// ─── POST /api/blog — create new post ─────────────────────────────────────
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, plan: true },
  });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const body = await request.json();
  const parsed = blogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Plan limits check (FREE: 5 posts)
  if (tenant.plan === "FREE") {
    const count = await prisma.blogPost.count({ where: { tenantId: tenant.id } });
    if (count >= 5) {
      return NextResponse.json(
        { error: "Free plan allows up to 5 blog posts. Upgrade to continue." },
        { status: 403 }
      );
    }
  }

  const { scheduledAt, publishedAt, featuredImage, ...rest } = parsed.data;

  // Check slug uniqueness
  const existing = await prisma.blogPost.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: rest.slug } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "A post with this slug already exists." }, { status: 409 });
  }

  const post = await prisma.blogPost.create({
    data: {
      ...rest,
      tenantId: tenant.id,
      authorId: session.user.id,
      authorName: session.user.name ?? undefined,
      featuredImage: featuredImage || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(post, { status: 201 });
}
