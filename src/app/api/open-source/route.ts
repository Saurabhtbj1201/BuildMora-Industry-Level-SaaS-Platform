import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const osProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "ARCHIVED"]).default("IN_PROGRESS"),
  githubLink: z.string().url("GitHub URL is required"),
  documentationLink: z.string().url().optional().or(z.literal("")),
  overview: z.string().optional(),
  problemStatement: z.string().optional(),
  features: z.string().optional(),
  installationGuide: z.string().optional(),
  contributionGuidelines: z.string().optional(),
  roadmap: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  skillsRequired: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
  ogTitle: z.string().max(160).optional(),
  ogDescription: z.string().max(300).optional(),
  metaKeywords: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const projects = await prisma.openSourceProject.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, status: true, isPublished: true, viewCount: true, createdAt: true },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { ownerId: session.user.id }, select: { id: true, plan: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Plan limits: FREE = 1 OS project
  if (tenant.plan === "FREE") {
    const count = await prisma.openSourceProject.count({ where: { tenantId: tenant.id } });
    if (count >= 1) {
      return NextResponse.json(
        { error: "Free plan allows 1 open source project. Upgrade to add more." },
        { status: 403 }
      );
    }
  }

  const body = await request.json();
  const parsed = osProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { documentationLink, ...rest } = parsed.data;

  const existing = await prisma.openSourceProject.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: rest.slug } },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ error: "Slug already exists." }, { status: 409 });

  const project = await prisma.openSourceProject.create({
    data: {
      ...rest,
      tenantId: tenant.id,
      documentationLink: documentationLink || null,
      publishedAt: rest.isPublished ? new Date() : null,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(project, { status: 201 });
}
