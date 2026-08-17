import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import type { PlanType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
    plan,
  } = body as {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
    plan: PlanType;
  };

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  // ── Verify HMAC signature ─────────────────────────────────────────────────
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const generated = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest("hex");

  if (generated !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // ── Upsert Subscription + upgrade Tenant plan ─────────────────────────────
  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId:           tenant.id,
        razorpaySubId:      razorpay_subscription_id,
        plan,
        status:             "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd:   nextMonth,
        cancelAtPeriodEnd:  false,
      },
      update: {
        razorpaySubId:      razorpay_subscription_id,
        plan,
        status:             "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd:   nextMonth,
        cancelAtPeriodEnd:  false,
      },
    }),
    prisma.tenant.update({
      where: { id: tenant.id },
      data:  { plan },
    }),
    prisma.paymentLog.create({
      data: {
        tenantId:              tenant.id,
        razorpayPaymentId:     razorpay_payment_id,
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpaySignature:     razorpay_signature,
        amount:                0, // actual amount set by webhook
        status:                "captured",
        description:           `Subscription upgrade to ${plan}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, plan });
}
