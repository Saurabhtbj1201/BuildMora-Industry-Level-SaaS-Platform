import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, ownerId: session.user.id } });
  if (!tenant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.tenantUserRole.findMany({
    where: { tenantId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members.map((m) => ({
    id: m.id, role: m.role, createdAt: m.createdAt.toISOString(), user: m.user,
  })));
}
