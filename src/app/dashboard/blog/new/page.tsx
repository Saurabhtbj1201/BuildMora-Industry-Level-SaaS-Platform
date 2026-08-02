import BlogForm from "@/components/blog/BlogForm";

export const metadata = { title: "New Blog Post" };

export default function NewBlogPostPage() {
  return <BlogForm mode="create" />;
}
