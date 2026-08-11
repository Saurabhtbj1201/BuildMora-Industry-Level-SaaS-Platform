import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import BlogForm from "@/components/blog/BlogForm";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { title: true } });
  return { title: post ? `Edit: ${post.title}` : "Edit Post" };
}

export default async function EditBlogPostPage({
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

  const post = await prisma.blogPost.findUnique({
    where: { id, tenantId: tenant.id },
  });
  if (!post) notFound();

  return (
    <BlogForm
      mode="edit"
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category ?? "",
        status: post.status as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED",
        excerpt: post.excerpt ?? "",
        content: post.content ?? "",
        tags: post.tags,
        featuredImage: post.featuredImage ?? "",
        readingTime: post.readingTime,
        scheduledAt: post.scheduledAt?.toISOString().slice(0, 16) ?? "",
        seoTitle: post.seoTitle ?? "",
        seoDescription: post.seoDescription ?? "",
        metaKeywords: post.metaKeywords ?? "",
      }}
    />
  );
}
