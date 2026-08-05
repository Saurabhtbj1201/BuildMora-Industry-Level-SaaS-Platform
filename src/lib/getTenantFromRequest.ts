import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

/**
 * Reads the x-tenant-id header set by the proxy middleware.
 * On the marketing domain (localhost:3000 etc.) this header won't exist,
 * so we fall back to a demo tenant via DEMO_TENANT_SLUG env var for previews.
 */
export async function getTenantFromRequest() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId, isActive: true },
      select: {
        id: true,
        siteName: true,
        siteSlug: true,
        tagline: true,
        footerText: true,
        seoDescription: true,
        ogImage: true,
        themeConfig: true,
        gaMeasurementId: true,
        logo: true,
        plan: true,
        profile: true,
      },
    });
    if (!tenant) notFound();
    return tenant;
  }

  // Fallback: preview via ?slug= param or DEMO_TENANT_SLUG env
  const demoSlug = process.env.DEMO_TENANT_SLUG;
  if (demoSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { siteSlug: demoSlug, isActive: true },
      select: {
        id: true,
        siteName: true,
        siteSlug: true,
        tagline: true,
        footerText: true,
        seoDescription: true,
        ogImage: true,
        themeConfig: true,
        gaMeasurementId: true,
        logo: true,
        plan: true,
        profile: true,
      },
    });
    if (!tenant) notFound();
    return tenant;
  }

  notFound();
}

export type PublicTenant = Awaited<ReturnType<typeof getTenantFromRequest>>;
