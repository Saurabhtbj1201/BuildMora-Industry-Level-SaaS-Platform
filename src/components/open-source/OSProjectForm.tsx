"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Loader2, ArrowLeft, X, AlertCircle, CheckCircle2,
  GitBranch, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import type { TipTapEditorProps } from "@/components/editor/TipTapEditor";

const TipTapEditor = dynamic<TipTapEditorProps>(
  () => import("@/components/editor/TipTapEditor").then((m) => m.TipTapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] bg-muted rounded-xl animate-pulse" />
    ),
  }
);

interface OSProjectData {
  id?: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  githubLink: string;
  documentationLink: string;
  overview: string;
  problemStatement: string;
  features: string;
  installationGuide: string;
  contributionGuidelines: string;
  roadmap: string;
  techStack: string[];
  skillsRequired: string[];
  isPublished: boolean;
  ogTitle: string;
  ogDescription: string;
  metaKeywords: string;
}

const OS_CATEGORIES = ["Library", "Framework", "CLI Tool", "Web App", "API", "DevOps", "AI/ML", "Game", "Other"];

const SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "problemStatement", label: "Problem Statement" },
  { key: "features", label: "Features" },
  { key: "installationGuide", label: "Installation Guide" },
  { key: "contributionGuidelines", label: "Contribution Guidelines" },
  { key: "roadmap", label: "Roadmap" },
] as const;

function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export default function OSProjectForm({
  initial,
  mode,
}: {
  initial?: Partial<OSProjectData>;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<string>("overview");

  const [form, setForm] = useState<OSProjectData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    category: initial?.category ?? "",
    status: initial?.status ?? "IN_PROGRESS",
    githubLink: initial?.githubLink ?? "",
    documentationLink: initial?.documentationLink ?? "",
    overview: initial?.overview ?? "",
    problemStatement: initial?.problemStatement ?? "",
    features: initial?.features ?? "",
    installationGuide: initial?.installationGuide ?? "",
    contributionGuidelines: initial?.contributionGuidelines ?? "",
    roadmap: initial?.roadmap ?? "",
    techStack: initial?.techStack ?? [],
    skillsRequired: initial?.skillsRequired ?? [],
    isPublished: initial?.isPublished ?? false,
    ogTitle: initial?.ogTitle ?? "",
    ogDescription: initial?.ogDescription ?? "",
    metaKeywords: initial?.metaKeywords ?? "",
  });

  const [techInput, setTechInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSeo, setShowSeo] = useState(false);

  function setField<K extends keyof OSProjectData>(key: K, value: OSProjectData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, ...(mode === "create" ? { slug: toSlug(title) } : {}) }));
  }

  function addTag(type: "tech" | "skill", value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    if (type === "tech" && !form.techStack.includes(trimmed)) {
      setField("techStack", [...form.techStack, trimmed]);
    }
    if (type === "skill" && !form.skillsRequired.includes(trimmed)) {
      setField("skillsRequired", [...form.skillsRequired, trimmed]);
    }
  }

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const url = mode === "edit" && initial?.id ? `/api/open-source/${initial.id}` : "/api/open-source";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      setSuccess("Saved successfully.");
      if (mode === "create" && data.id) router.push(`/dashboard/open-source/${data.id}/edit`);
    });
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/open-source")} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {mode === "create" ? "New OS Project" : form.title || "Edit Project"}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <span>Published</span>
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setField("isPublished", e.target.checked)}
              className="rounded border-border"
            />
          </label>
          <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5 text-xs">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2.5 p-3 bg-success/10 border border-success/20 rounded-xl text-sm text-success animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Left */}
          <div className="space-y-5">
            {/* Title + links */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Project title…"
                  className="w-full text-2xl font-bold font-display text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  slug: <code className="bg-muted px-1.5 py-0.5 rounded">{form.slug || "auto"}</code>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <GitBranch className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={form.githubLink}
                    onChange={(e) => setField("githubLink", e.target.value)}
                    placeholder="GitHub URL *"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={form.documentationLink}
                    onChange={(e) => setField("documentationLink", e.target.value)}
                    placeholder="Documentation URL"
                    className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Content sections */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Section tabs */}
              <div className="flex overflow-x-auto border-b border-border bg-muted/20">
                {SECTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActiveSection(s.key)}
                    className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      activeSection === s.key
                        ? "text-primary border-b-2 border-primary bg-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {SECTIONS.map((s) => (
                activeSection === s.key && (
                  <TipTapEditor
                    key={s.key}
                    value={form[s.key]}
                    onChange={(val: string) => setField(s.key, val)}
                    placeholder={`Write the ${s.label.toLowerCase()} section…`}
                  />
                )
              ))}
              </div>
            </div>

            {/* SEO */}
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
                <div className="p-4 pt-0 space-y-3 border-t border-border">
                  <input type="text" value={form.ogTitle} onChange={(e) => setField("ogTitle", e.target.value)} placeholder="OG Title" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <textarea value={form.ogDescription} onChange={(e) => setField("ogDescription", e.target.value)} rows={2} placeholder="OG Description" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  <input type="text" value={form.metaKeywords} onChange={(e) => setField("metaKeywords", e.target.value)} placeholder="keyword1, keyword2" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Metadata */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                <select value={form.category} onChange={(e) => setField("category", e.target.value)} className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none">
                  <option value="">Select category…</option>
                  {OS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                <select value={form.status} onChange={(e) => setField("status", e.target.value)} className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none">
                  <option value="PLANNING">Planning</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Tech Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {form.techStack.map((t) => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {t}
                    <button type="button" onClick={() => setField("techStack", form.techStack.filter((x) => x !== t))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag("tech", techInput); setTechInput(""); } }}
                placeholder="Add tech, press Enter…"
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Skills Required */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Skills Required</h3>
              <p className="text-xs text-muted-foreground">For contributors seeking to join.</p>
              <div className="flex flex-wrap gap-1.5">
                {form.skillsRequired.map((s) => (
                  <span key={s} className="flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                    {s}
                    <button type="button" onClick={() => setField("skillsRequired", form.skillsRequired.filter((x) => x !== s))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag("skill", skillInput); setSkillInput(""); } }}
                placeholder="Add skill, press Enter…"
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
