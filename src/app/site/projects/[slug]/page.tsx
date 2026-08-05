import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ArrowLeft, Tag } from "lucide-react";
import { GithubIcon } from "@/components/icons/social";
import EnquiryForm from "@/components/public/EnquiryForm";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
    select: { title: true, seoTitle: true, seoDescription: true, ogImage: true },
  });
  if (!project) return {};
  return {
    title: project.seoTitle ?? project.title,
    description: project.seoDescription ?? undefined,
    openGraph: { images: project.ogImage ? [project.ogImage] : [] },
  };
}

export default async function PublicProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const tenant = await getTenantFromRequest();
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
  });
  if (!project) notFound();

  const customLinks = project.customLinks as { label: string; url: string }[] | null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <Link href="/projects" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All Projects
      </Link>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">{project.category}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            project.status === "COMPLETED" ? "bg-success/10 text-success" :
            project.status === "IN_PROGRESS" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}>{project.status.replace("_", " ")}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground">{project.title}</h1>

        <div className="flex flex-wrap gap-3">
          {project.liveLink && (
            <a href={project.liveLink} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Live Demo
            </a>
          )}
          {project.githubLink && (
            <a href={project.githubLink} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-primary/30 transition-colors">
              <GithubIcon className="w-3.5 h-3.5" /> Source Code
            </a>
          )}
          {customLinks?.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-primary/30 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> {link.label}
            </a>
          ))}
        </div>

        {project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            {project.techStack.map((t) => (
              <span key={t} className="px-2.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">{t}</span>
            ))}
          </div>
        )}
      </div>

      {project.images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {project.images.map((img, i) => (
            <img key={i} src={img} alt={`${project.title} screenshot ${i + 1}`}
              className="rounded-xl border border-border w-full object-cover" />
          ))}
        </div>
      )}

      {project.description && (
        <div
          className="prose prose-sm sm:prose max-w-none text-foreground prose-headings:font-display prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: project.description }}
        />
      )}

      <div className="border-t border-border pt-10">
        <h2 className="text-xl font-bold font-display text-foreground mb-6">Interested in this project?</h2>
        <EnquiryForm tenantId={tenant.id} source="PROJECT" entityId={project.id} />
      </div>
    </div>
  );
}
