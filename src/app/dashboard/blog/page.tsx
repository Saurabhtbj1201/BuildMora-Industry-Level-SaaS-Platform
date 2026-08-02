import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  BookOpen, Plus, Eye, Edit2, Calendar,
  Tag, Clock, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Blog" };
export const revalidate = 0;

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-success/10 text-success",
  SCHEDULED: "bg-primary/10 text-primary",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; category?: string }>;
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
  const category = params.category ?? "";

  const posts = await prisma.blogPost.findMany({
    where: {
      tenantId: tenant.id,
      ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
      ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED" } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, category: true,
      status: true, publishedAt: true, scheduledAt: true,
      readingTime: true, tags: true, viewCount: true,
      excerpt: true, createdAt: true,
    },
  });

  // Stats
  const total = posts.length;
  const published = posts.filter((p) => p.status === "PUBLISHED").length;
  const drafts = posts.filter((p) => p.status === "DRAFT").length;
  const totalViews = posts.reduce((acc, p) => acc + p.viewCount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Blog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Write, publish, and manage your technical blog posts.
          </p>
        </div>
        <Link href="/dashboard/blog/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Posts", value: total, icon: BookOpen, color: "text-primary bg-primary/10" },
          { label: "Published", value: published, icon: Eye, color: "text-success bg-success/10" },
          { label: "Drafts", value: drafts, icon: Edit2, color: "text-warning bg-warning/10" },
          { label: "Total Views", value: totalViews, icon: Eye, color: "text-accent bg-accent/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold font-display text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Filter bar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-center bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search posts..."
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
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              defaultValue={category}
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Tutorial">Tutorial</option>
              <option value="Opinion">Opinion</option>
              <option value="Case Study">Case Study</option>
              <option value="News">News</option>
              <option value="Project Update">Project Update</option>
            </select>
          </div>
        </div>

        {/* Posts table */}
        {posts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-semibold">
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Views</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-foreground font-display truncate">
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {post.excerpt}
                        </p>
                      )}
                      {post.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-0.5"
                            >
                              <Tag className="w-2.5 h-2.5" />{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground">
                      {post.category ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[post.status] ?? ""}`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      {post.readingTime && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {post.readingTime} min read
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {post.viewCount}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/dashboard/blog/${post.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
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
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">No blog posts yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Share your knowledge, ideas, and experiences with the world. Your first post is just a click away.
            </p>
            <Link href="/dashboard/blog/new">
              <Button className="gap-2 mt-2">
                <Plus className="w-4 h-4" /> Write First Post
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
