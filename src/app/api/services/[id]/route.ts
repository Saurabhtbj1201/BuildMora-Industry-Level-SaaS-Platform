import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional().nullable(),
  currency: z.string().optional(),
  isPublished: z.boolean().optional(),
  customLinks: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
  metaKeywords: z.string().optional(),
});

async function getService(userId: string, serviceId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { ownerId: userId }, select: { id: true } });
  if (!tenant) return null;
  const service = await prisma.service.findUnique({ where: { id: serviceId, tenantId: tenant.id } });
  return { tenant, service };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getService(session.user.id, id);
  if (!result?.service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result.service);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getService(session.user.id, id);
  if (!result?.service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { price, ...rest } = parsed.data;

  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...rest,
      ...(price !== undefined ? { price: price ?? null } : {}),
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getService(session.user.id, id);
  if (!result?.service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted." });
}
