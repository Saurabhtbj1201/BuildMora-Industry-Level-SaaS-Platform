import { NextRequest } from "next/server";
import { generateAIContent, AICreditsExhaustedError } from "@/lib/gemini";
import { ok, err, requireAuth, requireTenantAccess, withErrorHandler, parseBody } from "@/lib/api";
import { hasPermission } from "@/lib/rbac";
import { aiGenerateSchema } from "@/lib/validators";

// POST /api/ai/generate
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId, role } = await requireTenantAccess(session.user.id);

  if (!hasPermission(role, "ai:use")) {
    return err("AI access not available for your role", 403);
  }

  const body = await parseBody(req, aiGenerateSchema);

  try {
    const result = await generateAIContent({
      tenantId,
      type: body.type,
      context: body.context,
    });

    return ok(result);
  } catch (error) {
    if (error instanceof AICreditsExhaustedError) {
      return err(
        `AI credit limit reached. You've used ${error.used}/${error.limit} credits this month. Upgrade your plan for more credits.`,
        429,
        { used: error.used, limit: error.limit }
      );
    }
    throw error;
  }
});

// GET /api/ai/credits — Get current credit usage for tenant
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId, plan } = await requireTenantAccess(session.user.id);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const ledger = await (await import("@/lib/db")).prisma.aiCreditLedger.findUnique({
    where: { tenantId_month: { tenantId, month: currentMonth } },
    select: { used: true, limit: true, month: true },
  });

  const creditLimits: Record<string, number> = {
    FREE: 10,
    STARTER: 50,
    PRO: 500,
    ENTERPRISE: -1,
  };

  const limit = creditLimits[plan] ?? 10;
  const used = ledger?.used ?? 0;
  const remaining = limit === -1 ? -1 : limit - used;
  const percentage = limit === -1 ? 0 : Math.round((used / limit) * 100);

  return ok({ used, limit, remaining, percentage, month: currentMonth, plan });
});
