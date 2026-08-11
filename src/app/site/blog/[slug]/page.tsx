import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react";

export const dynamic = 'force-dynamic';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
    select: { title: true, seoTitle: true, seoDescription: true, excerpt: true, ogImage: true },
  });
  if (!post) return {};
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    openGraph: { images: post.ogImage ? [post.ogImage] : [] },
  };
}

export default async function PublicBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const tenant = await getTenantFromRequest();
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug }, status: "PUBLISHED" },
  });
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/blog" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
        <ArrowLeft className="w-3.5 h-3.5" /> All Articles
      </Link>

      <header className="space-y-5 mb-10">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {post.category && (
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{post.category}</span>
          )}
          {post.readingTime && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readingTime} min read</span>
          )}
          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground leading-snug">{post.title}</h1>

        {post.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            {post.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium">{tag}</span>
            ))}
          </div>
        )}

        {post.ogImage && (
          <img src={post.ogImage} alt={post.title}
            className="w-full rounded-2xl border border-border object-cover aspect-video" />
        )}
      </header>

      {post.content && (
        <article
          className="prose prose-sm sm:prose-base max-w-none text-foreground
            prose-headings:font-display prose-headings:text-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-sm
            prose-pre:bg-muted prose-pre:border prose-pre:border-border
            prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground
            prose-img:rounded-xl prose-img:border prose-img:border-border"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}

      <div className="mt-14 pt-8 border-t border-border">
        <Link href="/blog" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to all articles
        </Link>
      </div>
    </div>
  );
}
