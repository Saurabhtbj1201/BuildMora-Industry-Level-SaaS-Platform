import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, requireAuth, requireTenantAccess, withErrorHandler } from "@/lib/api";

// PUT /api/personalization — Update theme settings
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId } = await requireTenantAccess(session.user.id);
  const body = await req.json();

  const themeConfig = {
    themeColor: body.themeColor,
    fontFamily: body.fontFamily,
    layoutVariant: body.layoutVariant,
  };

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      themeConfig: JSON.parse(JSON.stringify(themeConfig)),
    },
  });

  return ok(tenant);
});
