import { requireSuperAdmin } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { Settings } from "lucide-react";
import AdminSettingsClient from "@/components/super-admin/AdminSettingsClient";

export const metadata: Metadata = { title: "Settings" };
export const revalidate = 0;

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin();

  const superAdminsRaw = await prisma.user.findMany({
    where: { isSuperAdmin: true },
    select: { id: true, name: true, email: true, image: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const superAdmins = superAdminsRaw.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  const tenants = await prisma.tenant.findMany({
    select: { id: true, siteName: true, siteSlug: true, plan: true },
    orderBy: { siteName: "asc" },
  });

  return (
    <div className="p-6 space-y-8 min-h-full max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-violet-400" />
          Platform Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage super admins and grant AI credits</p>
      </div>

      <AdminSettingsClient superAdmins={superAdmins} tenants={tenants} />
    </div>
  );
}
