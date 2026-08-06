import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const metadata = { title: "Site Settings" };
export const revalidate = 0;

export default async function SettingsDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
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

  if (!tenant) redirect("/onboarding");

  // Derive the tenant's public URL from the current request host,
  // so it works in dev (localhost:3000) and production (buildmora.com).
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const publicSiteUrl = `${proto}://${tenant.siteSlug}.${host}`;

  return (
    <div className="p-6">
      <SettingsForm
        initialSettings={{
          siteName: tenant.siteName,
          siteSlug: tenant.siteSlug,
          tagline: tenant.tagline ?? undefined,
          footerText: tenant.footerText ?? undefined,
          seoDescription: tenant.seoDescription ?? undefined,
          metaKeywords: tenant.metaKeywords ?? undefined,
          ogImage: tenant.ogImage ?? undefined,
          gaMeasurementId: tenant.gaMeasurementId ?? undefined,
          customDomain: tenant.customDomain ?? undefined,
          customDomainVerified: tenant.customDomainVerified,
        }}
        publicSiteUrl={publicSiteUrl}
      />
    </div>
  );
}
