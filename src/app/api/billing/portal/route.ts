import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Fetch tenant basics ────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({
    where:  { ownerId: session.user.id },
    select: { id: true, plan: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // ── Run all sub-queries in parallel ────────────────────────────────────────
  const [subscription, payments, aiLedger, counts] = await Promise.all([
    prisma.subscription.findUnique({
      where: { tenantId: tenant.id },
    }),

    prisma.paymentLog.findMany({
      where:   { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take:    20,
      select: {
        id:               true,
        amount:           true,
        currency:         true,
        status:           true,
        description:      true,
        createdAt:        true,
        razorpayPaymentId: true,
      },
    }),

    prisma.aiCreditLedger.findUnique({
      where: { tenantId_month: { tenantId: tenant.id, month: currentMonth } },
      select: { used: true, limit: true },
    }),

    Promise.all([
      prisma.project.count({ where: { tenantId: tenant.id } }),
      prisma.blogPost.count({ where: { tenantId: tenant.id } }),
      prisma.service.count({ where: { tenantId: tenant.id } }),
      prisma.openSourceProject.count({ where: { tenantId: tenant.id } }),
    ]),
  ]);

  const [projectCount, blogCount, serviceCount, osCount] = counts;

  return NextResponse.json({
    plan:         tenant.plan,
    subscription,
    payments,
    usage: {
      projects:   projectCount,
      blogPosts:  blogCount,
      services:   serviceCount,
      openSource: osCount,
      aiCredits:  aiLedger ?? { used: 0, limit: 10 },
    },
  });
}
