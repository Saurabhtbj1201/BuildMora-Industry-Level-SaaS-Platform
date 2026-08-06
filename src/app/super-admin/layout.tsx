import { requireSuperAdmin } from "@/lib/superAdmin";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import type { ReactNode } from "react";

export const metadata = { title: { default: "Super Admin", template: "%s | Super Admin · BuildMora" } };

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSuperAdmin();

  return (
    <AuthSessionProvider session={session}>
      <div className="flex h-screen bg-[#080b12] overflow-hidden">
        <SuperAdminSidebar adminName={session.user?.name ?? session.user?.email ?? "Admin"} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
