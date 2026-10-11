"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/lib/utils";
import {
  Sparkles, Loader2, Plus, Trash2, Globe, Code2,
  Star, Tag, ArrowLeft, Check,
} from "lucide-react";

interface ProjectData {
  id?: string;
  title: string;
  slug?: string;
  category?: string;
  status?: string;
  startDate?: string;
  description?: string;
  liveLink?: string;
  githubLink?: string;
  customLinks?: { label: string; url: string }[];
  starsRating?: number;
  techStack?: string[];
  contributors?: { name: string; avatar?: string; github?: string }[];
  images?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  metaKeywords?: string[];
  isPublished?: boolean;
}

interface ProjectFormProps {
  initialData?: ProjectData;
  isEditing?: boolean;
}

export function ProjectForm({ initialData, isEditing = false }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "Web App");
  const [status, setStatus] = useState(initialData?.status ?? "IN_PROGRESS");
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 10) : ""
  );
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [liveLink, setLiveLink] = useState(initialData?.liveLink ?? "");
  const [githubLink, setGithubLink] = useState(initialData?.githubLink ?? "");
  const [starsRating, setStarsRating] = useState(initialData?.starsRating ?? 5);
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);

  // Tech stack tags
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>(initialData?.techStack ?? []);

  // Custom links
  const [customLinks, setCustomLinks] = useState<{ label: string; url: string }[]>(
    initialData?.customLinks ?? []
  );

  // Images
  const [imageInput, setImageInput] = useState("");
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);

  // SEO fields
  const [ogTitle, setOgTitle] = useState(initialData?.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(initialData?.ogDescription ?? "");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing || !slug) {
      setSlug(slugify(val));
    }
  };

  const addTechTag = () => {
    const trimmed = techInput.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed]);
      setTechInput("");
    }
  };

  const removeTechTag = (tag: string) => {
    setTechStack(techStack.filter((t) => t !== tag));
  };

  const addCustomLink = () => {
    setCustomLinks([...customLinks, { label: "Demo", url: "https://" }]);
  };

  const updateCustomLink = (index: number, key: "label" | "url", val: string) => {
    const updated = [...customLinks];
    if (updated[index]) {
      updated[index][key] = val;
    }
    setCustomLinks(updated);
  };

  const removeCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setImages([...images, imageInput.trim()]);
      setImageInput("");
    }
  };

  const handleAiAssist = async (type: string) => {
    if (!title) {
      alert("Please enter a project title first");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptType: type, context: { title, techStack: techStack.join(", ") } }),
      });
      const json = await res.json();
      if (json.success && json.data.content) {
        if (type === "project_description") {
          setDescription(json.data.content);
        } else if (type === "seo_meta") {
          setOgTitle(title);
          setOgDescription(json.data.content.slice(0, 160));
        }
      }
    } catch (err) {
      console.error("AI Error", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      title,
      slug: slug || slugify(title),
      category,
      status,
      startDate: startDate || undefined,
      description,
      liveLink: liveLink || undefined,
      githubLink: githubLink || undefined,
      customLinks,
      starsRating: Number(starsRating),
      techStack,
      images,
      ogTitle: ogTitle || title,
      ogDescription: ogDescription || undefined,
      isPublished,
    };

    try {
      const url = isEditing ? `/api/projects/${initialData?.id}` : "/api/projects";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save project");
      }

      router.push("/dashboard/projects");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header action bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-xl font-bold font-display text-foreground">
            {isEditing ? "Edit Project" : "New Project"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-foreground cursor-pointer">
              {isPublished ? "Published" : "Draft"}
            </label>
          </div>

          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEditing ? "Save Changes" : "Publish Project"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Project Title *
              </label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. MORA — AI Automated Portfolio Platform"
                className="text-lg font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                URL Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2.5 py-2 rounded-lg border border-border">
                  www.buildmora.tech/projects/
                </span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="mora-portfolio-platform"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Description (TipTap Editor) */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Detailed Description
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={aiLoading}
                onClick={() => handleAiAssist("project_description")}
                className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Generate with AI
              </Button>
            </div>

            <TipTapEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe key features, technical architecture, challenges overcome, and outcomes..."
            />
          </div>

          {/* Tech Stack Tags */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              Tech Stack
            </label>
            <div className="flex gap-2">
              <Input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTechTag();
                  }
                }}
                placeholder="e.g. Next.js, TypeScript, PostgreSQL"
              />
              <Button type="button" variant="secondary" onClick={addTechTag}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {techStack.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTechTag(tag)}
                    className="hover:text-destructive transition-colors ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Custom Links */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                External &amp; Demo Links
              </label>
              <Button type="button" variant="outline" size="sm" onClick={addCustomLink} className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Link
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Live URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    value={liveLink}
                    onChange={(e) => setLiveLink(e.target.value)}
                    placeholder="https://myproject.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  GitHub Repository
                </label>
                <div className="relative">
                  <Code2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {customLinks.map((link, idx) => (
              <div key={idx} className="flex gap-2 items-center pt-2">
                <Input
                  value={link.label}
                  onChange={(e) => updateCustomLink(idx, "label", e.target.value)}
                  placeholder="Label (e.g. API Docs)"
                  className="w-1/3 text-xs"
                />
                <Input
                  value={link.url}
                  onChange={(e) => updateCustomLink(idx, "url", e.target.value)}
                  placeholder="https://"
                  className="flex-1 text-xs"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomLink(idx)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Controls (Right 1 col) */}
        <div className="space-y-6">
          {/* Metadata & Status */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold font-display text-foreground border-b border-border pb-2">
              Metadata
            </h3>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Web App">Web Application</option>
                <option value="Mobile App">Mobile Application</option>
                <option value="AI / ML">AI / ML Model</option>
                <option value="API / Backend">API / Backend</option>
                <option value="DevTools">DevTools</option>
                <option value="CLI">CLI Utility</option>
                <option value="UI Library">UI Library</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Star Rating (1–5)
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarsRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= starsRating ? "fill-warning text-warning" : "text-muted border-border"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Project Screenshots */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold font-display text-foreground border-b border-border pb-2">
              Screenshots &amp; Media
            </h3>

            <div className="flex gap-2">
              <Input
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="Image URL"
                className="text-xs"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addImage}>
                Add
              </Button>
            </div>

            <div className="space-y-2 pt-2">
              {images.map((img, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/40 border border-border rounded-lg text-xs">
                  <span className="truncate max-w-[180px]">{img}</span>
                  <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SEO Preview */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold font-display text-foreground border-b border-border pb-2">
              SEO &amp; OpenGraph
            </h3>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                OG Title
              </label>
              <Input
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                placeholder={title || "Project Title"}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                OG Description
              </label>
              <textarea
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder="Short summary for social media shares..."
                rows={3}
                className="w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
