import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GithubIcon } from "@/components/icons/social";
import EnquiryForm from "@/components/public/EnquiryForm";

export const dynamic = 'force-dynamic';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  const { slug } = await params;
  const project = await prisma.openSourceProject.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
    select: { title: true, seoTitle: true, seoDescription: true },
  });
  if (!project) return {};
  return { title: project.seoTitle ?? project.title, description: project.seoDescription ?? undefined };
}

export default async function PublicOsProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const tenant = await getTenantFromRequest();
  const { slug } = await params;

  const project = await prisma.openSourceProject.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug }, isPublished: true },
    include: {
      contributors: {
        select: { id: true, name: true, role: true, avatarUrl: true, githubUrl: true, bio: true },
      },
    },
  });
  if (!project) notFound();

  const techStack = project.techStack as string[];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <Link href="/open-source" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All Open Source Projects
      </Link>

      <div className="space-y-4">
        <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">{project.category}</span>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground">{project.title}</h1>

        <div className="flex flex-wrap gap-3">
          {project.githubLink && (
            <a href={project.githubLink} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-primary/30 transition-colors">
              <GithubIcon className="w-3.5 h-3.5" /> View on GitHub
            </a>
          )}
        </div>

        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techStack.map((t) => (
              <span key={t} className="px-2.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">{t}</span>
            ))}
          </div>
        )}
      </div>

      {project.overview && (
        <div
          className="prose prose-sm sm:prose-base max-w-none text-foreground
            prose-headings:font-display prose-a:text-primary
            prose-code:bg-muted prose-code:px-1 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: project.overview as string }}
        />
      )}

      {project.contributors.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold font-display text-foreground">Contributors ({project.contributors.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.contributors.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" /> : c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                  {c.role && <p className="text-xs text-primary truncate">{c.role}</p>}
                  {c.bio && <p className="text-xs text-muted-foreground line-clamp-1">{c.bio}</p>}
                </div>
                {c.githubUrl && (
                  <a href={c.githubUrl} target="_blank" rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <GithubIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="border-t border-border pt-10">
        <h2 className="text-xl font-bold font-display text-foreground mb-6">Interested in contributing?</h2>
        <EnquiryForm tenantId={tenant.id} source="OPEN_SOURCE" entityId={project.id} />
      </div>
    </div>
  );
}
