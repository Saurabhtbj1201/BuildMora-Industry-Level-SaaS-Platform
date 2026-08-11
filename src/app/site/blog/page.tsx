import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Metadata } from "next";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

export const dynamic = 'force-dynamic';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  return { title: "Blog", description: `Articles and insights from ${tenant.siteName}` };
}

export default async function PublicBlogPage() {
  const tenant = await getTenantFromRequest();

  const posts = await prisma.blogPost.findMany({
    where: { tenantId: tenant.id, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true, title: true, slug: true, category: true, excerpt: true,
      tags: true, publishedAt: true, readingTime: true, ogImage: true,
    },
  });

  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-primary" /> Blog
        </h1>
        <p className="text-muted-foreground">Thoughts, tutorials, and insights.</p>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span key={cat} className="px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground border border-border">{cat}</span>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No posts published yet.</div>
      ) : (
        <div className="space-y-5">
          {/* Featured first post */}
          {posts[0] && (
            <Link href={`/blog/${posts[0].slug}`}
              className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all">
              {posts[0].ogImage && (
                <img src={posts[0].ogImage} alt={posts[0].title} className="w-full h-52 sm:h-64 object-cover" />
              )}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {posts[0].category && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{posts[0].category}</span>}
                  {posts[0].readingTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{posts[0].readingTime} min read</span>}
                  {posts[0].publishedAt && <span>{new Date(posts[0].publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground group-hover:text-primary transition-colors">{posts[0].title}</h2>
                {posts[0].excerpt && <p className="text-sm text-muted-foreground leading-relaxed">{posts[0].excerpt}</p>}
                <div className="flex items-center gap-1 text-sm text-primary font-medium">
                  Read article <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          )}

          {/* Remaining posts grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.slice(1).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col">
                {post.ogImage && (
                  <img src={post.ogImage} alt={post.title} className="w-full h-36 object-cover" />
                )}
                <div className="p-4 space-y-2 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.category && <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{post.category}</span>}
                    {post.readingTime && <span>{post.readingTime} min</span>}
                  </div>
                  <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors flex-1">{post.title}</h3>
                  {post.excerpt && <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                  {post.publishedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
