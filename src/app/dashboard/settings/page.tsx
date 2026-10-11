import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const dynamic = 'force-dynamic';

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

  // Build the tenant's public subdomain URL.
  // Priority: NEXT_PUBLIC_APP_URL env var → fallback to request host.
  // On Vercel without a custom domain, subdomains aren't available on vercel.app —
  // in that case we show the direct URL and note that a custom domain is needed.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  let publicSiteUrl: string;

  if (appUrl) {
    // Parse the base URL — e.g. "https://buildmora.vercel.app" or "https://buildmora.com"
    const appUrlObj = new URL(appUrl);
    const isVercelApp = appUrlObj.hostname.endsWith(".vercel.app");
    const isLocalhost  = appUrlObj.hostname === "localhost";

    if (isLocalhost) {
      // Dev: http://demo.localhost:3000
      publicSiteUrl = `http://${tenant.siteSlug}.localhost:${appUrlObj.port || 3000}`;
    } else if (isVercelApp) {
      // Vercel preview — no wildcard subdomains; show base URL
      publicSiteUrl = appUrl;
    } else {
      // Custom domain — strip www. if present so subdomain is slug.buildmora.tech
      const apexDomain = appUrlObj.hostname.replace(/^www\./, "");
      publicSiteUrl = `https://${tenant.siteSlug}.${apexDomain}`;
    }
  } else {
    // Fallback: derive from request host header
    const headersList = await headers();
    const host  = headersList.get("host") ?? "localhost:3000";
    const proto = host.includes("localhost") ? "http" : "https";
    publicSiteUrl = `${proto}://${tenant.siteSlug}.${host}`;
  }

  const isVercelPreview = !!appUrl && new URL(appUrl).hostname.endsWith(".vercel.app");

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
        isVercelPreview={isVercelPreview}
      />
    </div>
  );
}
