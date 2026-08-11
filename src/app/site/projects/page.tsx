import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Metadata } from "next";
import { Briefcase, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons/social";

export const dynamic = 'force-dynamic';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  return { title: "Projects", description: `Browse all projects by ${tenant.siteName}` };
}

export default async function PublicProjectsPage() {
  const tenant = await getTenantFromRequest();

  const projects = await prisma.project.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, category: true, status: true,
      techStack: true, description: true, liveLink: true, githubLink: true, images: true,
    },
  });

  const categories = [...new Set(projects.map((p) => p.category))];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-primary" /> Projects
        </h1>
        <p className="text-muted-foreground">A collection of things I've built and worked on.</p>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span key={cat} className="px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground border border-border">
              {cat}
            </span>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No projects published yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div key={p.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col">
              {p.images[0] ? (
                <img src={p.images[0]} alt={p.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-primary/40" />
                </div>
              )}

              <div className="p-5 flex flex-col flex-1 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{p.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === "COMPLETED" ? "bg-success/10 text-success" :
                    p.status === "IN_PROGRESS" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>{p.status.replace("_", " ")}</span>
                </div>

                <div className="flex-1">
                  <h2 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">{p.title}</h2>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: p.description.replace(/<[^>]*>/g, " ").slice(0, 120) }} />
                  )}
                </div>

                {p.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.techStack.slice(0, 5).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                    ))}
                    {p.techStack.length > 5 && <span className="text-[10px] text-muted-foreground">+{p.techStack.length - 5}</span>}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/projects/${p.slug}`}
                    className="flex-1 text-center text-xs py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                    View Details
                  </Link>
                  {p.liveLink && (
                    <a href={p.liveLink} target="_blank" rel="noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {p.githubLink && (
                    <a href={p.githubLink} target="_blank" rel="noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
                      <GithubIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
