import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import ContributorsClient from "@/components/dashboard/ContributorsClient";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "Contributors" };
export const revalidate = 0;

export default async function ContributorsDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  if (!tenant) redirect("/onboarding");

  const [contributors, osProjects] = await Promise.all([
    prisma.oSContributor.findMany({
      where: { tenantId: tenant.id },
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.openSourceProject.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold font-display text-foreground">Contributors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage open source project contributors across all your projects.
        </p>
      </div>
      <ContributorsClient
        tenantId={tenant.id}
        initialContributors={contributors.map((c) => ({
          id: c.id,
          name: c.name,
          githubUrl: c.githubUrl,
          role: c.role,
          avatarUrl: c.avatarUrl,
          bio: c.bio,
          projectId: c.projectId,
          projectTitle: c.project.title,
          createdAt: c.createdAt.toISOString(),
        }))}
        osProjects={osProjects}
      />
    </div>
  );
}
