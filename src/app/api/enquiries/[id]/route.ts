import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "RESOLVED", "ARCHIVED"]),
});

async function getEnquiry(userId: string, enquiryId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { ownerId: userId }, select: { id: true } });
  if (!tenant) return null;
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId, tenantId: tenant.id } });
  return { tenant, enquiry };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getEnquiry(session.user.id, id);
  if (!result?.enquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const updated = await prisma.enquiry.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getEnquiry(session.user.id, id);
  if (!result?.enquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.enquiry.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted." });
}
