"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Loader2, ArrowLeft, X, AlertCircle, CheckCircle2,
  DollarSign, Globe, Plus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import type { TipTapEditorProps } from "@/components/editor/TipTapEditor";

const TipTapEditor = dynamic<TipTapEditorProps>(
  () => import("@/components/editor/TipTapEditor").then((m) => m.TipTapEditor),
  {
    ssr: false,
    loading: () => <div className="min-h-[200px] bg-muted rounded-xl animate-pulse" />,
  }
);

interface ServiceData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  isPublished: boolean;
  customLinks: { label: string; url: string }[];
  seoTitle: string;
  seoDescription: string;
  metaKeywords: string;
}

function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export default function ServiceForm({ initial, mode }: { initial?: Partial<ServiceData>; mode: "create" | "edit" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ServiceData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? "",
    currency: initial?.currency ?? "INR",
    isPublished: initial?.isPublished ?? false,
    customLinks: initial?.customLinks ?? [],
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    metaKeywords: initial?.metaKeywords ?? "",
  });
  const [showSeo, setShowSeo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function setField<K extends keyof ServiceData>(key: K, value: ServiceData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, ...(mode === "create" ? { slug: toSlug(title) } : {}) }));
  }

  function addLink() {
    setField("customLinks", [...form.customLinks, { label: "", url: "" }]);
  }

  function updateLink(i: number, field: "label" | "url", value: string) {
    const links = [...form.customLinks];
    links[i] = { ...links[i]!, [field]: value };
    setField("customLinks", links);
  }

  function removeLink(i: number) {
    setField("customLinks", form.customLinks.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        customLinks: form.customLinks.filter((l) => l.label && l.url),
      };
      const url = mode === "edit" && initial?.id ? `/api/services/${initial.id}` : "/api/services";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      setSuccess("Service saved.");
      if (mode === "create" && data.id) router.push(`/dashboard/services/${data.id}/edit`);
    });
  }

  async function handleDelete() {
    if (!initial?.id || !confirm("Delete this service? This cannot be undone.")) return;
    startTransition(async () => {
      await fetch(`/api/services/${initial.id}`, { method: "DELETE" });
      router.push("/dashboard/services");
    });
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/services")} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {mode === "create" ? "New Service" : form.title || "Edit Service"}
            </p>
          </div>
          {mode === "edit" && (
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending} className="h-8 w-8 text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <span>Published</span>
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setField("isPublished", e.target.checked)} className="rounded border-border" />
          </label>
          <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5 text-xs">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          {/* Left — main content */}
          <div className="space-y-5">
            {/* Title + Slug */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Service title…"
                className="w-full text-2xl font-bold font-display text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>slug:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded">{form.slug || "auto"}</code>
                {mode === "edit" && (
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setField("slug", toSlug(e.target.value))}
                    className="bg-muted px-1.5 py-0.5 rounded border border-border outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </div>
              <TipTapEditor
                value={form.description}
                onChange={(val) => setField("description", val)}
                placeholder="Describe what you offer, deliverables, timeline, and expertise…"
              />
            </div>

            {/* Custom Links */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Custom Links
                </h3>
                <Button variant="ghost" size="sm" onClick={addLink} className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" /> Add Link
                </Button>
              </div>
              {form.customLinks.length === 0 && (
                <p className="text-xs text-muted-foreground">Add portfolio links, demos, or pricing sheets.</p>
              )}
              {form.customLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(i, "label", e.target.value)}
                    placeholder="Label"
                    className="flex-1 px-2.5 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                    placeholder="https://…"
                    className="flex-[2] px-2.5 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button type="button" onClick={() => removeLink(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
                  <input type="text" value={form.seoTitle} onChange={(e) => setField("seoTitle", e.target.value)} placeholder="SEO Title" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <textarea value={form.seoDescription} onChange={(e) => setField("seoDescription", e.target.value)} rows={2} placeholder="Meta Description" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  <input type="text" value={form.metaKeywords} onChange={(e) => setField("metaKeywords", e.target.value)} placeholder="keyword1, keyword2" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Pricing */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Pricing
              </h3>
              <div className="flex gap-2">
                <select
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                  className="h-10 w-20 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder="0.00"
                  className="flex-1 h-10 px-3 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <p className="text-xs text-muted-foreground">Leave blank to show "Contact for pricing".</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
