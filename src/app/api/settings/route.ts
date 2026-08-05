import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, err, requireAuth, requireTenantAccess, withErrorHandler } from "@/lib/api";

// GET /api/settings
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId } = await requireTenantAccess(session.user.id);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      siteName: true,
      siteSlug: true,
      tagline: true,
      footerText: true,
      seoDescription: true,
      metaKeywords: true,
      ogImage: true,
      gaMeasurementId: true,
      customDomain: true,
      customDomainVerified: true,
    },
  });

  return ok(tenant);
});

// PUT /api/settings
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId } = await requireTenantAccess(session.user.id);
  const body = await req.json();

  // If customDomain changed, verify uniqueness
  if (body.customDomain) {
    const existing = await prisma.tenant.findFirst({
      where: {
        customDomain: body.customDomain,
        id: { not: tenantId },
      },
    });

    if (existing) {
      return err("This custom domain is already registered to another site", 400);
    }
  }

  const updatedTenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      siteName: body.siteName,
      tagline: body.tagline || null,
      footerText: body.footerText || null,
      seoDescription: body.seoDescription || null,
      metaKeywords: body.metaKeywords || null,
      ogImage: body.ogImage || null,
      gaMeasurementId: body.gaMeasurementId || null,
      customDomain: body.customDomain || null,
      // Reset verification when domain changes
      ...(body.customDomain !== undefined && {
        customDomainVerified: false,
        customDomainVerifiedAt: null,
      }),
    },
  });

  return ok({ success: true, tenant: updatedTenant });
});
