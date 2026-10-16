import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, err, requireAuth, requireTenantAccess, withErrorHandler } from "@/lib/api";
import { invalidateTenantCache } from "@/lib/tenant";

export const dynamic = 'force-dynamic';

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

  // If siteSlug changed, validate and verify uniqueness
  let newSlug: string | undefined = undefined;
  if (body.siteSlug !== undefined) {
    const cleanSlug = body.siteSlug.toLowerCase().trim();
    if (!/^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/.test(cleanSlug)) {
      return err("Subdomain must be 3-48 characters, lowercase letters, numbers, and hyphens only", 400);
    }

    const reserved = ["www", "api", "admin", "dashboard", "super-admin", "app", "auth", "login", "register", "site", "blog", "portfolio"];
    if (reserved.includes(cleanSlug)) {
      return err("This subdomain name is reserved. Please choose another.", 400);
    }

    const existingSlug = await prisma.tenant.findFirst({
      where: {
        siteSlug: cleanSlug,
        id: { not: tenantId },
      },
    });

    if (existingSlug) {
      return err("This subdomain is already taken by another site. Please pick another.", 400);
    }

    newSlug = cleanSlug;
  }

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
      ...(newSlug !== undefined && { siteSlug: newSlug }),
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

  // Invalidate in-memory caches
  invalidateTenantCache(newSlug, body.customDomain || undefined);

  // Send security email notification for setting changes
  const changesSummary: string[] = [];
  if (body.siteName) changesSummary.push(`Site Name: "${body.siteName}"`);
  if (newSlug) changesSummary.push(`Portfolio Subdomain: "${newSlug}.buildmora.tech"`);
  if (body.customDomain !== undefined) changesSummary.push(`Custom Domain: "${body.customDomain || "None"}"`);
  if (body.seoDescription) changesSummary.push("Updated SEO Description & Meta tags");
  if (body.gaMeasurementId) changesSummary.push("Updated Google Analytics 4 ID");

  if (changesSummary.length > 0 && session.user.email) {
    const { sendSettingsChangedNotification } = await import("@/lib/email-service");
    sendSettingsChangedNotification({
      userEmail: session.user.email,
      userName: session.user.name,
      siteName: updatedTenant.siteName,
      changes: changesSummary,
    }).catch((err) => console.error("[Email] Settings change notification error:", err));
  }

  return ok({ success: true, tenant: updatedTenant });
});
