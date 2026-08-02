"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Loader2, Eye, EyeOff, ArrowLeft, Sparkles,
  Tag, X, Clock, Calendar, AlertCircle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import type { TipTapEditorProps } from "@/components/editor/TipTapEditor";

// Lazy load the TipTap editor to keep bundle small
const TipTapEditor = dynamic<TipTapEditorProps>(
  () => import("@/components/editor/TipTapEditor").then((m) => m.TipTapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[400px] bg-muted rounded-xl animate-pulse flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);


// ─── Types ────────────────────────────────────────────────────────────────────
interface BlogPostData {
  id?: string;
  title: string;
  slug: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  excerpt: string;
  content: string;
  tags: string[];
  featuredImage: string;
  readingTime: number | null;
  scheduledAt: string;
  seoTitle: string;
  seoDescription: string;
  metaKeywords: string;
}

interface BlogFormProps {
  initial?: Partial<BlogPostData>;
  mode: "create" | "edit";
}

const CATEGORIES = ["Tutorial", "Opinion", "Case Study", "News", "Project Update", "Tech Deep Dive", "Personal"];

// ─── Slug generator ───────────────────────────────────────────────────────────
function toSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// ─── Word count → reading time ────────────────────────────────────────────────
function estimateReadingTime(html: string) {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogForm({ initial, mode }: BlogFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState<BlogPostData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    category: initial?.category ?? "",
    status: initial?.status ?? "DRAFT",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    tags: initial?.tags ?? [],
    featuredImage: initial?.featuredImage ?? "",
    readingTime: initial?.readingTime ?? null,
    scheduledAt: initial?.scheduledAt ?? "",
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    metaKeywords: initial?.metaKeywords ?? "",
  });

  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSeo, setShowSeo] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Auto-generate slug when title changes (only on create)
  const handleTitleChange = useCallback((title: string) => {
    setForm((f) => ({
      ...f,
      title,
      ...(mode === "create" ? { slug: toSlug(title) } : {}),
    }));
  }, [mode]);

  const handleContentChange = useCallback((content: string) => {
    setForm((f) => ({
      ...f,
      content,
      readingTime: estimateReadingTime(content),
    }));
  }, []);

  // ─── Tag management ─────────────────────────────────────────────────────────
  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
        setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  // ─── AI excerpt generation ──────────────────────────────────────────────────
  async function generateExcerpt() {
    if (!form.content) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "blog_excerpt",
          context: { title: form.title, content: form.content.replace(/<[^>]+>/g, " ").slice(0, 2000) },
        }),
      });
      const data = await res.json();
      if (data.text) setForm((f) => ({ ...f, excerpt: data.text }));
    } catch {
      // Silently fail
    } finally {
      setAiLoading(false);
    }
  }

  // ─── Save ───────────────────────────────────────────────────────────────────
  function handleSave(statusOverride?: "DRAFT" | "PUBLISHED") {
    setError(null);
    setSuccess(null);

    const payload = {
      ...form,
      status: statusOverride ?? form.status,
      ...(statusOverride === "PUBLISHED" ? { publishedAt: new Date().toISOString() } : {}),
    };

    startTransition(async () => {
      const url = mode === "edit" && initial?.id
        ? `/api/blog/${initial.id}`
        : "/api/blog";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save post.");
        return;
      }

      setSuccess(statusOverride === "PUBLISHED" ? "Post published!" : "Draft saved.");
      if (mode === "create" && data.id) {
        router.push(`/dashboard/blog/${data.id}/edit`);
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Top toolbar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/blog")}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {mode === "create" ? "New Blog Post" : form.title || "Edit Post"}
            </p>
            <p className="text-xs text-muted-foreground">
              {form.readingTime ? `~${form.readingTime} min read · ` : ""}
              {form.status}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode((v) => !v)}
              className="gap-1.5 text-xs hidden sm:flex"
            >
              {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave("DRAFT")}
              disabled={isPending}
              className="gap-1.5 text-xs"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave("PUBLISHED")}
              disabled={isPending}
              className="gap-1.5 text-xs"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* ── Notifications ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-3">
        {error && (
          <div className="flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2.5 p-3 bg-success/10 border border-success/20 rounded-xl text-sm text-success animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Left: Editor ─────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Title */}
          <div>
            <input
              id="blog-title"
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title…"
              className="w-full text-3xl font-bold font-display text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50 resize-none"
            />
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>slug:</span>
              <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{form.slug || "auto-generated"}</code>
              {mode === "edit" && (
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                  className="ml-1 bg-muted px-1.5 py-0.5 rounded text-foreground border border-border outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              )}
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Excerpt
              </label>
              <button
                type="button"
                onClick={generateExcerpt}
                disabled={aiLoading || !form.content}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Generate
              </button>
            </div>
            <textarea
              id="blog-excerpt"
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              rows={2}
              maxLength={300}
              placeholder="A brief summary of your post…"
              className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <p className="text-right text-[11px] text-muted-foreground mt-0.5">
              {form.excerpt.length}/300
            </p>
          </div>

          {/* TipTap Editor */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
              Content
            </label>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {previewMode ? (
                <div
                  className="p-5 prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: form.content }}
                />
              ) : (
                <TipTapEditor
                  value={form.content}
                  onChange={handleContentChange}
                  placeholder="Start writing your post…"
                />
              )}
            </div>
          </div>

          {/* SEO Panel */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeo((v) => !v)}
              className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
            >
              <span>SEO Settings</span>
              <span className="text-muted-foreground text-xs">{showSeo ? "▲" : "▼"}</span>
            </button>
            {showSeo && (
              <div className="p-4 pt-0 space-y-4 border-t border-border">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={form.seoTitle}
                    onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                    placeholder={form.title}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={form.seoDescription}
                    onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                    rows={2}
                    placeholder={form.excerpt || "Describe your post…"}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    value={form.metaKeywords}
                    onChange={(e) => setForm((f) => ({ ...f, metaKeywords: e.target.value }))}
                    placeholder="keyword1, keyword2, …"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Publish</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BlogPostData["status"] }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {form.status === "SCHEDULED" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Scheduled Date
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none"
                />
              </div>
            )}

            {form.readingTime && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Estimated: <strong className="text-foreground">{form.readingTime} min read</strong>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Category</h3>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none"
            >
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" /> Tags
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Add tag, press Enter…"
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">{form.tags.length}/10 tags</p>
          </div>

          {/* Featured Image URL */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Featured Image</h3>
            <input
              type="url"
              value={form.featuredImage}
              onChange={(e) => setForm((f) => ({ ...f, featuredImage: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {form.featuredImage && (
              <img
                src={form.featuredImage}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-border mt-2"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
