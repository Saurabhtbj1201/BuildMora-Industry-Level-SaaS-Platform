import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import type { SubStatus, PlanType } from "@prisma/client";

export const dynamic = "force-dynamic";

// Razorpay sends raw body — we need it as a string for HMAC verification
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  // ── Verify webhook signature ────────────────────────────────────────────────
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const generated = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (generated !== signature) {
    console.warn("[billing/webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.event;
  const payload   = event.payload as Record<string, { entity: Record<string, unknown> }>;

  console.log(`[billing/webhook] Event: ${eventName}`);

  try {
    switch (eventName) {
      // ── Subscription events ───────────────────────────────────────────────
      case "subscription.activated": {
        const sub   = payload.subscription?.entity;
        const subId = sub?.id as string;
        if (!subId) break;
        await prisma.subscription.updateMany({
          where: { razorpaySubId: subId },
          data:  { status: "ACTIVE" as SubStatus },
        });
        break;
      }

      case "subscription.charged": {
        const sub     = payload.subscription?.entity;
        const payment = payload.payment?.entity;
        const subId   = sub?.id as string;
        if (!subId || !payment) break;

        const dbSub = await prisma.subscription.findUnique({
          where:  { razorpaySubId: subId },
          select: { tenantId: true, plan: true },
        });
        if (!dbSub) break;

        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await prisma.$transaction([
          prisma.subscription.update({
            where: { razorpaySubId: subId },
            data: {
              status:            "ACTIVE" as SubStatus,
              currentPeriodStart: new Date(),
              currentPeriodEnd:   periodEnd,
            },
          }),
          prisma.paymentLog.create({
            data: {
              tenantId:              dbSub.tenantId,
              razorpayPaymentId:     payment.id as string,
              razorpaySubscriptionId: subId,
              amount:                Number(payment.amount as number) / 100,
              currency:              (payment.currency as string) ?? "INR",
              status:                "captured",
              description:           `Monthly charge — ${dbSub.plan}`,
            },
          }),
        ]);
        break;
      }

      case "subscription.cancelled": {
        const sub   = payload.subscription?.entity;
        const subId = sub?.id as string;
        if (!subId) break;

        const dbSub = await prisma.subscription.findUnique({
          where:  { razorpaySubId: subId },
          select: { tenantId: true },
        });
        if (!dbSub) break;

        await prisma.$transaction([
          prisma.subscription.update({
            where: { razorpaySubId: subId },
            data:  { status: "CANCELLED" as SubStatus },
          }),
          // Downgrade to FREE when subscription cancelled
          prisma.tenant.update({
            where: { id: dbSub.tenantId },
            data:  { plan: "FREE" as PlanType },
          }),
        ]);
        break;
      }

      case "subscription.completed": {
        const sub   = payload.subscription?.entity;
        const subId = sub?.id as string;
        if (!subId) break;
        const dbSub = await prisma.subscription.findUnique({
          where:  { razorpaySubId: subId },
          select: { tenantId: true },
        });
        if (!dbSub) break;
        await prisma.$transaction([
          prisma.subscription.update({
            where: { razorpaySubId: subId },
            data:  { status: "CANCELLED" as SubStatus },
          }),
          prisma.tenant.update({
            where: { id: dbSub.tenantId },
            data:  { plan: "FREE" as PlanType },
          }),
        ]);
        break;
      }

      case "payment.failed": {
        const payment = payload.payment?.entity;
        const subId   = payment?.subscription_id as string | undefined;
        if (!subId) break;
        await prisma.subscription.updateMany({
          where: { razorpaySubId: subId },
          data:  { status: "PAST_DUE" as SubStatus },
        });
        break;
      }

      default:
        // Unhandled event — acknowledge but ignore
        break;
    }
  } catch (err) {
    console.error(`[billing/webhook] Error processing ${eventName}:`, err);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
