import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  FolderGit2, Plus, Search, ExternalLink, Code2,
  Edit2, Star, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Projects",
};

export const revalidate = 0;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, siteSlug: true },
  });

  if (!tenant) redirect("/onboarding");

  const params = await searchParams;
  const query = params.query ?? "";
  const category = params.category ?? "";
  const status = params.status ?? "";

  const where = {
    tenantId: tenant.id,
    ...(query ? { title: { contains: query, mode: "insensitive" as const } } : {}),
    ...(category ? { category } : {}),
    ...(status ? { status: status as any } : {}),
  };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      status: true,
      startDate: true,
      isPublished: true,
      starsRating: true,
      techStack: true,
      viewCount: true,
      liveLink: true,
      githubLink: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-primary" />
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showcase and manage your software projects, apps, and tools.
          </p>
        </div>

        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Project
          </Button>
        </Link>
      </div>

      {/* Projects Table & Filters Container */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Filter Bar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              defaultValue={query}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              defaultValue={category}
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Web App">Web App</option>
              <option value="Mobile App">Mobile App</option>
              <option value="AI / ML">AI / ML</option>
              <option value="API / Backend">API / Backend</option>
              <option value="DevTools">DevTools</option>
            </select>

            <select
              defaultValue={status}
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-semibold">
                  <th className="text-left py-3 px-4">Project</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Tech Stack</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Rating</th>
                  <th className="text-left py-3 px-4">Views</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                    {/* Project Title + Links */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground font-display">
                          {project.title}
                        </span>
                        {!project.isPublished && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {project.liveLink && (
                          <a
                            href={project.liveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Live
                          </a>
                        )}
                        {project.githubLink && (
                          <a
                            href={project.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Code2 className="w-3 h-3" /> Code
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-xs font-medium text-foreground">
                      {project.category || "—"}
                    </td>

                    {/* Tech Stack */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {project.techStack.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.techStack.length > 3 && (
                          <span className="text-[10px] text-muted-foreground self-center">
                            +{project.techStack.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          project.status === "COMPLETED"
                            ? "bg-success/10 text-success"
                            : project.status === "IN_PROGRESS"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Star Rating */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-0.5 text-xs text-warning">
                        <Star className="w-3.5 h-3.5 fill-warning" />
                        <span className="font-semibold text-foreground">{project.starsRating}</span>
                      </div>
                    </td>

                    {/* View Count */}
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {project.viewCount}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/projects/${project.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">No projects found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Get started by showcasing your first project, application, or open source contribution.
            </p>
            <Link href="/dashboard/projects/new">
              <Button className="gap-2 mt-2">
                <Plus className="w-4 h-4" /> Add Project
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
