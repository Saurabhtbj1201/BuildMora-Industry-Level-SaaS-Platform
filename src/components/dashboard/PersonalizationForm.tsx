"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Palette, Type, Layout, Check, Loader2 } from "lucide-react";

const COLOR_PALETTES = [
  { id: "indigo", name: "Indigo (Default)", primary: "hsl(222,89%,58%)", previewBg: "bg-blue-600" },
  { id: "emerald", name: "Emerald Cyber", primary: "hsl(142,76%,36%)", previewBg: "bg-emerald-600" },
  { id: "violet", name: "Violet Pulse", primary: "hsl(260,60%,56%)", previewBg: "bg-purple-600" },
  { id: "amber", name: "Amber Glow", primary: "hsl(38,92%,50%)", previewBg: "bg-amber-500" },
  { id: "crimson", name: "Crimson Red", primary: "hsl(0,84%,60%)", previewBg: "bg-red-600" },
  { id: "cyan", name: "Cyan Electric", primary: "hsl(188,86%,53%)", previewBg: "bg-cyan-500" },
  { id: "monochrome", name: "Monochrome Dark", primary: "hsl(0,0%,90%)", previewBg: "bg-zinc-200" },
];

const FONTS = [
  { id: "inter", name: "Inter", description: "Clean modern sans-serif for high readability" },
  { id: "outfit", name: "Outfit", description: "Geometrical & bold for sleek tech portfolios" },
  { id: "jetbrains", name: "JetBrains Mono", description: "Developer-centric monospace aesthetic" },
];

const LAYOUTS = [
  { id: "developer", name: "Developer Focus", description: "Highlights code, terminal snippet, tech stack badges, and GitHub stars" },
  { id: "creative", name: "Creative Showcase", description: "Visual grid layout with large project thumbnails and sleek hover animations" },
  { id: "academic", name: "Academic & Research", description: "Clean, structured list layout focusing on publications, experience, and credentials" },
  { id: "minimal", name: "Minimalist", description: "Ultra-clean distraction-free layout with elegant typography" },
];

interface PersonalizationFormProps {
  initialData?: {
    themeColor?: string;
    fontFamily?: string;
    layoutVariant?: string;
  };
}

export function PersonalizationForm({ initialData }: PersonalizationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState(initialData?.themeColor ?? "indigo");
  const [selectedFont, setSelectedFont] = useState(initialData?.fontFamily ?? "inter");
  const [selectedLayout, setSelectedLayout] = useState(initialData?.layoutVariant ?? "developer");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/personalization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeColor: selectedColor,
          fontFamily: selectedFont,
          layoutVariant: selectedLayout,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save personalization");

      setMessage("Personalization theme saved successfully!");
      router.refresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Palette className="w-6 h-6 text-primary" />
            Personalization
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your public portfolio&apos;s theme color, typography, and visual layout.
          </p>
        </div>

        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Apply Theme
        </Button>
      </div>

      {message && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-medium">
          {message}
        </div>
      )}

      {/* 1. Color Palette Selection */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold font-display text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Palette className="w-4 h-4 text-primary" />
          Primary Color Palette
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLOR_PALETTES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedColor(c.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                selectedColor === c.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full ${c.previewBg} border border-border`} />
                <span className="text-xs font-semibold text-foreground">{c.name}</span>
              </div>
              {selectedColor === c.id && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Font Family Selection */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold font-display text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Type className="w-4 h-4 text-primary" />
          Typography Font Family
        </h2>

        <div className="grid sm:grid-cols-3 gap-4">
          {FONTS.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => setSelectedFont(font.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedFont === font.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground font-display">{font.name}</span>
                {selectedFont === font.id && <Check className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{font.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Layout Variant Selection */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold font-display text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Layout className="w-4 h-4 text-primary" />
          Portfolio Layout Variant
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => setSelectedLayout(layout.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedLayout === layout.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground font-display">{layout.name}</span>
                {selectedLayout === layout.id && <Check className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{layout.description}</p>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
