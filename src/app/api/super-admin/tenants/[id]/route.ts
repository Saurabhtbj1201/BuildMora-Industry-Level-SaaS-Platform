import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await getSuperAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true, siteName: true, siteSlug: true, plan: true, isActive: true,
      customDomain: true, customDomainVerified: true, createdAt: true, updatedAt: true,
      owner: { select: { id: true, name: true, email: true, isActive: true } },
      _count: {
        select: { projects: true, blogPosts: true, services: true, enquiries: true, contacts: true },
      },
      aiCreditLedgers: { orderBy: { month: "desc" }, take: 6 },
      subscription: true,
    },
  });

  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tenant);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await getSuperAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { plan, isActive, grantCredits, month } = await req.json();

  if (plan !== undefined) {
    await prisma.tenant.update({ where: { id }, data: { plan } });
  }
  if (isActive !== undefined) {
    await prisma.tenant.update({ where: { id }, data: { isActive } });
  }
  if (grantCredits !== undefined) {
    const targetMonth = month ?? new Date().toISOString().slice(0, 7);
    await prisma.aiCreditLedger.upsert({
      where: { tenantId_month: { tenantId: id, month: targetMonth } },
      create: { tenantId: id, month: targetMonth, used: 0, limit: grantCredits },
      update: { limit: grantCredits },
    });
  }

  return NextResponse.json({ success: true });
}
