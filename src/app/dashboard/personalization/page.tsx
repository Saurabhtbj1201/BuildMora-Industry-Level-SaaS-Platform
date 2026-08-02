import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PersonalizationForm } from "@/components/dashboard/PersonalizationForm";

export const metadata = {
  title: "Personalization",
};

export const revalidate = 0;

export default async function PersonalizationDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: {
      themeConfig: true,
    },
  });

  if (!tenant) redirect("/onboarding");

  const themeConfig = (tenant.themeConfig as any) || {};

  return (
    <div className="p-6">
      <PersonalizationForm
        initialData={{
          themeColor: themeConfig.themeColor || "indigo",
          fontFamily: themeConfig.fontFamily || "inter",
          layoutVariant: themeConfig.layoutVariant || "developer",
        }}
      />
    </div>
  );
}
