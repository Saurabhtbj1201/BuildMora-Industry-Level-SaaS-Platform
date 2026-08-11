import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().min(1),
  projectId: z.string(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  role: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().optional(),
});

async function getContributor(id: string, ownerId: string) {
  const contributor = await prisma.oSContributor.findUnique({
    where: { id },
    include: { project: { include: { tenant: { select: { ownerId: true } } } } },
  });
  if (!contributor) return null;
  if (contributor.project.tenant.ownerId !== ownerId) return null;
  return contributor;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contributor = await getContributor(id, session.user.id);
  if (!contributor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { name, projectId, githubUrl, role, avatarUrl, bio } = parsed.data;

  await prisma.oSContributor.update({
    where: { id },
    data: {
      name,
      projectId,
      githubUrl: githubUrl || null,
      role: role || null,
      avatarUrl: avatarUrl || null,
      bio: bio || null,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contributor = await getContributor(id, session.user.id);
  if (!contributor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.oSContributor.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
