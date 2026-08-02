import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  category: z.string().optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "ARCHIVED"]).optional(),
  githubLink: z.string().url().optional(),
  documentationLink: z.string().url().optional().or(z.literal("")),
  overview: z.string().optional(),
  problemStatement: z.string().optional(),
  features: z.string().optional(),
  installationGuide: z.string().optional(),
  contributionGuidelines: z.string().optional(),
  roadmap: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  skillsRequired: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  ogTitle: z.string().max(160).optional(),
  ogDescription: z.string().max(300).optional(),
  metaKeywords: z.string().optional(),
});

async function getProject(userId: string, projectId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { ownerId: userId }, select: { id: true } });
  if (!tenant) return null;
  const project = await prisma.openSourceProject.findUnique({ where: { id: projectId, tenantId: tenant.id } });
  return { tenant, project };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getProject(session.user.id, id);
  if (!result?.project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result.project);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getProject(session.user.id, id);
  if (!result?.project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { documentationLink, isPublished, ...rest } = parsed.data;

  const updated = await prisma.openSourceProject.update({
    where: { id },
    data: {
      ...rest,
      ...(documentationLink !== undefined ? { documentationLink: documentationLink || null } : {}),
      ...(isPublished !== undefined ? {
        isPublished,
        publishedAt: isPublished && !result.project.publishedAt ? new Date() : result.project.publishedAt,
      } : {}),
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getProject(session.user.id, id);
  if (!result?.project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.openSourceProject.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted." });
}
