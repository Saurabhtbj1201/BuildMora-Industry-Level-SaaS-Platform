import { NextResponse } from "next/server";
import { PLAN_PRICING } from "@/lib/razorpay";
import { PLAN_FEATURES, PLAN_LIMITS } from "@/lib/planLimits";
import type { PlanType } from "@prisma/client";

export const dynamic = "force-dynamic";

const PLANS: PlanType[] = ["FREE", "STARTER", "PRO", "ENTERPRISE"];

export async function GET() {
  const plans = PLANS.map((plan) => ({
    id: plan,
    name: plan.charAt(0) + plan.slice(1).toLowerCase(),
    pricing: PLAN_PRICING[plan],
    features: PLAN_FEATURES[plan],
    limits: PLAN_LIMITS[plan],
    popular: plan === "PRO",
  }));

  return NextResponse.json({ plans });
}
