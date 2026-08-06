import { NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const currentMonth = now.toISOString().slice(0, 7);

  const [
    totalUsers, totalTenants, activeTenants,
    newUsersLast30, newTenantsLast30,
    openSupport, planDist, aiUsage,
    recentAuditLogs, recentSupportTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.tenant.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.supportRequest.count({ where: { status: "OPEN" } }),
    prisma.tenant.groupBy({ by: ["plan"], _count: { _all: true } }),
    prisma.aiCreditLedger.aggregate({
      where: { month: currentMonth },
      _sum: { used: true, limit: true },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.supportRequest.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      take: 5,
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      select: { id: true, subject: true, priority: true, status: true, createdAt: true, name: true },
    }),
  ]);

  // Daily new users for chart (last 30 days)
  const dailyUsers = await prisma.user.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  });

  return NextResponse.json({
    totalUsers,
    totalTenants,
    activeTenants,
    newUsersLast30,
    newTenantsLast30,
    openSupport,
    planDistribution: planDist.map((p) => ({ plan: p.plan, count: p._count._all })),
    aiCreditsUsed: aiUsage._sum.used ?? 0,
    recentAuditLogs: recentAuditLogs.map((l) => ({
      id: l.id, action: l.action, entity: l.entity, entityId: l.entityId,
      createdAt: l.createdAt, user: l.user,
    })),
    urgentTickets: recentSupportTickets,
    dailyUsers: dailyUsers.map((d) => ({
      date: d.createdAt.toISOString().slice(0, 10),
      count: d._count._all,
    })),
  });
}
