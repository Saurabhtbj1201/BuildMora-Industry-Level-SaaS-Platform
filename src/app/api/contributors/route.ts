import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const schema = z.object({
  tenantId: z.string(),
  projectId: z.string(),
  name: z.string().min(1),
  githubUrl: z.string().url().optional().or(z.literal("")),
  role: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId ?? "", ownerId: session.user.id } });
  if (!tenant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contributors = await prisma.oSContributor.findMany({
    where: { tenantId: tenant.id },
    include: { project: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contributors.map((c) => ({
    id: c.id, name: c.name, githubUrl: c.githubUrl, role: c.role,
    avatarUrl: c.avatarUrl, bio: c.bio, projectId: c.projectId,
    projectTitle: c.project.title, createdAt: c.createdAt.toISOString(),
  })));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { tenantId, projectId, name, githubUrl, role, avatarUrl, bio } = parsed.data;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, ownerId: session.user.id } });
  if (!tenant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contributor = await prisma.oSContributor.create({
    data: {
      tenantId,
      projectId,
      name,
      githubUrl: githubUrl || null,
      role: role || null,
      avatarUrl: avatarUrl || null,
      bio: bio || null,
    },
  });

  return NextResponse.json(contributor, { status: 201 });
}
