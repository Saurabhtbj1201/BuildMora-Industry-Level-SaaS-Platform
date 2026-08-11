import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import AdminsClient from "@/components/dashboard/AdminsClient";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "Admins & Access" };
export const revalidate = 0;

export default async function AdminsDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, siteName: true },
  });
  if (!tenant) redirect("/onboarding");

  const members = await prisma.tenantUserRole.findMany({
    where: { tenantId: tenant.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold font-display text-foreground">Admins & Access</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage who has access to your <span className="font-medium text-foreground">{tenant.siteName}</span> dashboard.
        </p>
      </div>
      <AdminsClient
        tenantId={tenant.id}
        initialMembers={members.map((m) => ({
          id: m.id,
          role: m.role,
          createdAt: m.createdAt.toISOString(),
          user: m.user,
        }))}
        ownerEmail={session.user.email ?? ""}
      />
    </div>
  );
}
