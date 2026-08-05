import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch tenant + AI credit info
  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      siteName: true,
      siteSlug: true,
      plan: true,
      aiCreditLedgers: {
        where: {
          month: new Date().toISOString().slice(0, 7),
        },
        select: { used: true, limit: true },
        take: 1,
      },
    },
  });

  if (!tenant) redirect("/onboarding");

  const aiCredits = tenant.aiCreditLedgers[0]
    ? { used: tenant.aiCreditLedgers[0].used, limit: tenant.aiCreditLedgers[0].limit }
    : { used: 0, limit: 10 };

  return (
    // Pass the server-fetched session so DashboardTopbar's useSession()
    // works without a client-side refetch or missing SessionProvider.
    <AuthSessionProvider session={session}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar
          tenantSlug={tenant.siteSlug}
          siteName={tenant.siteName}
          aiCredits={aiCredits}
        />

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <DashboardTopbar />
          <main className="flex-1 overflow-y-auto bg-surface">
            <div className="page-transition">{children}</div>
          </main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
