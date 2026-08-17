import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      plan: true,
      subscription: true,
      paymentLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          createdAt: true,
          razorpayPaymentId: true,
        },
      },
      aiCreditLedgers: {
        where: { month: new Date().toISOString().slice(0, 7) },
        select: { used: true, limit: true },
        take: 1,
      },
      _count: {
        select: {
          projects:    true,
          blog:        true,
          services:    true,
          openSource:  true,
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    plan:         tenant.plan,
    subscription: tenant.subscription,
    payments:     tenant.paymentLogs,
    usage: {
      projects:   tenant._count.projects,
      blogPosts:  tenant._count.blog,
      services:   tenant._count.services,
      openSource: tenant._count.openSource,
      aiCredits:  tenant.aiCreditLedgers[0] ?? { used: 0, limit: 10 },
    },
  });
}
