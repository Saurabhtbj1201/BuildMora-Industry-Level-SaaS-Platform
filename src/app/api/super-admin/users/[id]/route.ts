import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";

async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, image: true,
      isActive: true, isSuperAdmin: true, emailVerified: true, createdAt: true,
      tenant: {
        select: {
          id: true, siteName: true, siteSlug: true, plan: true, isActive: true,
          customDomain: true, createdAt: true,
          _count: { select: { projects: true, blogPosts: true, services: true, enquiries: true } },
          aiCreditLedgers: { orderBy: { month: "desc" }, take: 3 },
        },
      },
      auditLogs: { take: 10, orderBy: { createdAt: "desc" },
        select: { id: true, action: true, entity: true, createdAt: true, ipAddress: true } },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSuperAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = await getUser(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSuperAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action, credits, month } = body;

  // Prevent self-disable
  if (id === session.user?.id && action === "disable") {
    return NextResponse.json({ error: "Cannot disable your own account" }, { status: 400 });
  }

  if (action === "disable") {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
  } else if (action === "enable") {
    await prisma.user.update({ where: { id }, data: { isActive: true } });
  } else if (action === "grantCredits") {
    const tenant = await prisma.tenant.findUnique({ where: { ownerId: id }, select: { id: true } });
    if (!tenant) return NextResponse.json({ error: "User has no tenant" }, { status: 400 });

    const targetMonth = month ?? new Date().toISOString().slice(0, 7);
    await prisma.aiCreditLedger.upsert({
      where: { tenantId_month: { tenantId: tenant.id, month: targetMonth } },
      create: { tenantId: tenant.id, month: targetMonth, used: 0, limit: credits ?? 100 },
      update: { limit: credits ?? 100 },
    });
  } else if (action === "promote") {
    await prisma.user.update({ where: { id }, data: { isSuperAdmin: true } });
  } else if (action === "demote") {
    if (id === session.user?.id) return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
    await prisma.user.update({ where: { id }, data: { isSuperAdmin: false } });
  }

  return NextResponse.json({ success: true });
}
