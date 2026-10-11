"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe, Shield, BarChart3, Settings, Check, Loader2,
  Copy, Info, ExternalLink,
} from "lucide-react";

interface SettingsFormProps {
  initialSettings: {
    siteName: string;
    siteSlug: string;
    tagline?: string;
    footerText?: string;
    // SEO
    seoDescription?: string;
    metaKeywords?: string;
    ogImage?: string;
    // Analytics
    gaMeasurementId?: string;
    // Domain
    customDomain?: string;
    customDomainVerified?: boolean;
  };
  publicSiteUrl: string;
  isVercelPreview?: boolean;
}

export function SettingsForm({ initialSettings, publicSiteUrl, isVercelPreview }: SettingsFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "analytics" | "domain">("general");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // General
  const [siteName, setSiteName] = useState(initialSettings.siteName ?? "");
  const [tagline, setTagline] = useState(initialSettings.tagline ?? "");
  const [footerText, setFooterText] = useState(initialSettings.footerText ?? "");

  // SEO
  const [seoDescription, setSeoDescription] = useState(initialSettings.seoDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState(initialSettings.metaKeywords ?? "");
  const [ogImage, setOgImage] = useState(initialSettings.ogImage ?? "");

  // Analytics
  const [gaMeasurementId, setGaMeasurementId] = useState(initialSettings.gaMeasurementId ?? "");

  // Domain & Subdomain
  const [siteSlug, setSiteSlug] = useState(initialSettings.siteSlug ?? "");
  const [customDomain, setCustomDomain] = useState(initialSettings.customDomain ?? "");

  const handleCopyCname = () => {
    navigator.clipboard.writeText("cname.buildmora.tech");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const payload = {
      siteName,
      siteSlug: siteSlug.toLowerCase().trim(),
      tagline,
      footerText,
      seoDescription,
      metaKeywords,
      ogImage: ogImage || null,
      gaMeasurementId,
      customDomain: customDomain ? customDomain.toLowerCase().trim() : null,
    };

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update settings");
      }

      setMessage("Settings updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Site Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure global site details, SEO defaults, Google Analytics, and custom domain.
          </p>
        </div>

        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>

      {message && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-medium">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        {[
          { id: "general",   label: "General",        icon: Settings  },
          { id: "seo",       label: "SEO & OpenGraph", icon: Shield    },
          { id: "analytics", label: "Analytics (GA4)", icon: BarChart3 },
          { id: "domain",    label: "Custom Domain",   icon: Globe     },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: General */}
      {activeTab === "general" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Site Title / Brand Name
            </label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Saurabh's Portfolio"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Tagline
            </label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Building Next-Gen Software & Distributed Systems"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Footer Text
            </label>
            <Input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="© 2026 Saurabh Kumar. Built with BuildMora."
            />
          </div>
        </div>
      )}

      {/* Tab 2: SEO */}
      {activeTab === "seo" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Site Meta Description
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              placeholder="Discover projects, technical blogs, open source contributions, and software engineering services."
              className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Shown in search engine results. Aim for 120–160 characters.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Meta Keywords <span className="font-normal text-muted-foreground">(comma-separated)</span>
            </label>
            <Input
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="portfolio, fullstack developer, react, nextjs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Default OpenGraph / Social Share Image URL
            </label>
            <Input
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://buildmora-assets.s3.amazonaws.com/og-default.png"
            />
            {ogImage && (
              <img src={ogImage} alt="OG preview" className="mt-2 rounded-lg border border-border h-28 object-cover" />
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Analytics */}
      {activeTab === "analytics" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs text-foreground">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <p>
              Connect your Google Analytics account. Enter your GA4 Measurement ID to track site visitors, page views, and engagement automatically.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Google Analytics 4 Measurement ID
            </label>
            <Input
              value={gaMeasurementId}
              onChange={(e) => setGaMeasurementId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Found in Google Analytics → Admin → Data Streams → Web Stream Details.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Custom Domain */}
      {activeTab === "domain" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-display text-foreground">
              Tenant Domain & SSL Configuration
            </h3>
            <p className="text-xs text-muted-foreground">
              Every portfolio receives a free subdomain automatically.
            </p>
          </div>

          {/* Subdomain Editor */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Choose Your Portfolio Subdomain / Username
              </label>
              <div className="flex items-center gap-2 max-w-lg">
                <span className="text-xs text-muted-foreground font-mono bg-muted px-3 py-2.5 rounded-lg border border-border shrink-0 select-none">
                  https://
                </span>
                <Input
                  value={siteSlug}
                  onChange={(e) => setSiteSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="your-username"
                  className="font-mono text-sm"
                />
                <span className="text-xs text-muted-foreground font-mono bg-muted px-3 py-2.5 rounded-lg border border-border shrink-0 select-none">
                  .{process.env.NEXT_PUBLIC_APP_DOMAIN ?? "buildmora.tech"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This is your free, custom subdomain. Use lowercase letters, numbers, and hyphens (3–48 chars). Click &quot;Save Changes&quot; to apply.
              </p>
            </div>
          </div>

          {/* Current Live Subdomain Link */}
          <div className="p-4 bg-muted/30 border border-border rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Live Subdomain URL
                </p>
                <p className="text-sm font-bold font-mono text-foreground break-all">
                  {siteSlug === initialSettings.siteSlug
                    ? publicSiteUrl
                    : `https://${siteSlug || "username"}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "buildmora.tech"}`}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success flex items-center gap-1 shrink-0">
                <Check className="w-3 h-3" /> Active
              </span>
            </div>
            {isVercelPreview ? (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                Wildcard DNS record required: add <code className="font-mono">*.buildmora.tech</code> in your DNS provider and Vercel domains for subdomains to resolve publicly.
              </p>
            ) : (
              <a
                href={siteSlug === initialSettings.siteSlug
                  ? publicSiteUrl
                  : `https://${siteSlug || "username"}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "buildmora.tech"}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <ExternalLink className="w-3 h-3" /> View Public Site
              </a>
            )}
          </div>

          {/* Custom domain */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Custom Domain <span className="text-muted-foreground font-normal">(Pro & Enterprise)</span>
              </label>
              {initialSettings.customDomainVerified && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success flex items-center gap-1">
                  <Check className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <Input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="e.g. portfolio.yourname.com"
              className="font-mono text-sm"
            />
          </div>

          {/* DNS instructions */}
          <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              DNS Configuration Instructions
            </h4>
            <p className="text-xs text-muted-foreground">
              Add a <strong>CNAME</strong> record in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
            </p>
            <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-muted-foreground mr-4">Type: CNAME</span>
                <span className="text-muted-foreground mr-4">Host: @ / subdomain</span>
                <span className="text-foreground font-semibold">Target: cname.buildmora.tech</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleCopyCname} className="gap-1 text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
