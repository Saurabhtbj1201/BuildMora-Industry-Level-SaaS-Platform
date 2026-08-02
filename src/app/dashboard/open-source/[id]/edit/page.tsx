import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import OSProjectForm from "@/components/open-source/OSProjectForm";

export const metadata = { title: "Edit OS Project" };

export default async function EditOSProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  if (!tenant) redirect("/onboarding");

  const project = await prisma.openSourceProject.findUnique({
    where: { id, tenantId: tenant.id },
  });
  if (!project) notFound();

  return (
    <OSProjectForm
      mode="edit"
      initial={{
        id: project.id,
        title: project.title,
        slug: project.slug,
        category: project.category,
        status: project.status,
        githubLink: project.githubLink,
        documentationLink: project.documentationLink ?? "",
        overview: project.overview ?? "",
        problemStatement: project.problemStatement ?? "",
        features: project.features ?? "",
        installationGuide: project.installationGuide ?? "",
        contributionGuidelines: project.contributionGuidelines ?? "",
        roadmap: project.roadmap ?? "",
        techStack: project.techStack,
        skillsRequired: project.skillsRequired,
        isPublished: project.isPublished,
        ogTitle: project.ogTitle ?? "",
        ogDescription: project.ogDescription ?? "",
        metaKeywords: project.metaKeywords ?? "",
      }}
    />
  );
}
