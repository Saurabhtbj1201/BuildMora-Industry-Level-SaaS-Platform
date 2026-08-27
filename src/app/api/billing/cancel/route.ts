import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, subscription: true },
  });

  if (!tenant?.subscription?.razorpaySubId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  try {
    // Cancel at end of current billing period
    await (getRazorpay().subscriptions as unknown as {
      cancel: (id: string, cancelAtCycleEnd: boolean) => Promise<void>;
    }).cancel(tenant.subscription.razorpaySubId, true);

    await prisma.subscription.update({
      where: { tenantId: tenant.id },
      data:  { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ success: true, cancelAtPeriodEnd: true });
  } catch (err) {
    console.error("[billing/cancel] Razorpay error:", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
