import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const schema = z.object({
  memberId: z.string(),
  role: z.enum(["ADMIN", "COLLABORATOR", "VIEWER"]),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { memberId, role } = parsed.data;

  const member = await prisma.tenantUserRole.findUnique({
    where: { id: memberId },
    include: { tenant: { select: { ownerId: true } } },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (member.tenant.ownerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.tenantUserRole.update({ where: { id: memberId }, data: { role } });

  return NextResponse.json({ success: true });
}
