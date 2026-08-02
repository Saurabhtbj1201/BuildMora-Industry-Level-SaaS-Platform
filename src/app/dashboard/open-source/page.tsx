import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Code2, Plus, Eye, Edit2, GitBranch,
  Users, CheckSquare, Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Open Source Projects" };
export const revalidate = 0;

const STATUS_STYLE: Record<string, string> = {
  PLANNING: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  COMPLETED: "bg-success/10 text-success",
  ON_HOLD: "bg-warning/10 text-warning",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export default async function OSProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  if (!tenant) redirect("/onboarding");

  const params = await searchParams;
  const query = params.query ?? "";
  const status = params.status ?? "";

  const projects = await prisma.openSourceProject.findMany({
    where: {
      tenantId: tenant.id,
      ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, category: true,
      status: true, githubLink: true, isPublished: true,
      techStack: true, viewCount: true, createdAt: true,
      _count: { select: { contributors: true, tasks: true } },
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            Open Source Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your open source projects, contributors, and task boards.
          </p>
        </div>
        <Link href="/dashboard/open-source/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New OS Project
          </Button>
        </Link>
      </div>

      {/* Table card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Filter bar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-center bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              defaultValue={query}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <select
              defaultValue={status}
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="ARCHIVED">Archived</option>
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
                  <th className="text-left py-3 px-4">Tech Stack</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Contributors</th>
                  <th className="text-left py-3 px-4">Tasks</th>
                  <th className="text-left py-3 px-4">Views</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/30 transition-colors">
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
                        {project.githubLink && (
                          <a
                            href={project.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <GitBranch className="w-3 h-3" /> GitHub
                          </a>
                        )}
                        <span>{project.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {project.techStack.slice(0, 3).map((t) => (
                          <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {t}
                          </span>
                        ))}
                        {project.techStack.length > 3 && (
                          <span className="text-[10px] text-muted-foreground self-center">+{project.techStack.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[project.status] ?? ""}`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {project._count.contributors}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckSquare className="w-3.5 h-3.5" />
                        {project._count.tasks}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                        {project.viewCount}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/dashboard/open-source/${project.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">No open source projects</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Showcase your open source contributions — add installation guides, roadmaps, and contributor task boards.
            </p>
            <Link href="/dashboard/open-source/new">
              <Button className="gap-2 mt-2">
                <Plus className="w-4 h-4" /> Add OS Project
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
