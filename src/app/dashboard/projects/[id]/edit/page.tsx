import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectForm } from "@/components/projects/ProjectForm";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Edit Project",
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!tenant) redirect("/onboarding");

  const project = await prisma.project.findFirst({
    where: { id, tenantId: tenant.id },
  });

  if (!project) notFound();

  return (
    <div className="p-6">
      <ProjectForm
        initialData={{
          id: project.id,
          title: project.title,
          slug: project.slug,
          category: project.category || undefined,
          status: project.status,
          startDate: project.startDate?.toISOString() || undefined,
          description: project.description || undefined,
          liveLink: project.liveLink || undefined,
          githubLink: project.githubLink || undefined,
          customLinks: (project.customLinks as any) || undefined,
          starsRating: project.starsRating ?? undefined,
          techStack: project.techStack,
          contributors: (project.contributors as any) || undefined,
          images: project.images,
          ogImage: project.ogImage || undefined,
          ogTitle: project.ogTitle || undefined,
          ogDescription: project.ogDescription || undefined,
          metaKeywords: project.metaKeywords ? [project.metaKeywords] : undefined,
          isPublished: project.isPublished,
        }}
        isEditing
      />
    </div>
  );
}
