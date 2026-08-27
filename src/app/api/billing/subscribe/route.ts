import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRazorpay, RAZORPAY_PLAN_IDS } from "@/lib/razorpay";
import type { PlanType } from "@prisma/client";

export const dynamic = "force-dynamic";

const UPGRADEABLE_PLANS: PlanType[] = ["STARTER", "PRO", "ENTERPRISE"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const plan = (body.plan as string)?.toUpperCase() as PlanType;

  if (!UPGRADEABLE_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planId = RAZORPAY_PLAN_IDS[plan];
  if (!planId) {
    return NextResponse.json(
      { error: `Razorpay plan ID for ${plan} not configured. Set RAZORPAY_PLAN_${plan} in environment variables.` },
      { status: 503 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, subscription: { select: { razorpayCustomerId: true } } },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  try {
    const subscriptionParams: Record<string, unknown> = {
      plan_id: planId,
      total_count: 12, // 12 billing cycles (1 year)
      quantity: 1,
      notify_info: {
        notify_phone: null,
        notify_email: session.user.email,
      },
    };

    // Re-use existing Razorpay customer id if available
    if (tenant.subscription?.razorpayCustomerId) {
      subscriptionParams.customer_id = tenant.subscription.razorpayCustomerId;
    }

    const rz = getRazorpay();
    const subscription = await rz.subscriptions.create(subscriptionParams as unknown as Parameters<typeof rz.subscriptions.create>[0]);

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan,
    });
  } catch (err) {
    console.error("[billing/subscribe] Razorpay error:", err);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
