"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe, Shield, BarChart3, Settings, Check, Loader2,
  Copy, Info,
} from "lucide-react";

interface SettingsFormProps {
  initialSettings: {
    siteName: string;
    siteSlug: string;
    tagline?: string;
    footerText?: string;
    contactEmail?: string;
    defaultOgTitle?: string;
    defaultOgDescription?: string;
    defaultOgImage?: string;
    gaMeasurementId?: string;
    customDomain?: string;
    customDomainStatus?: string;
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "analytics" | "domain">("general");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [siteName, setSiteName] = useState(initialSettings.siteName ?? "");
  const [tagline, setTagline] = useState(initialSettings.tagline ?? "");
  const [footerText, setFooterText] = useState(initialSettings.footerText ?? "");
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail ?? "");

  // SEO State
  const [defaultOgTitle, setDefaultOgTitle] = useState(initialSettings.defaultOgTitle ?? "");
  const [defaultOgDescription, setDefaultOgDescription] = useState(initialSettings.defaultOgDescription ?? "");
  const [defaultOgImage, setDefaultOgImage] = useState(initialSettings.defaultOgImage ?? "");

  // Analytics State
  const [gaMeasurementId, setGaMeasurementId] = useState(initialSettings.gaMeasurementId ?? "");

  // Domain State
  const [customDomain, setCustomDomain] = useState(initialSettings.customDomain ?? "");

  const handleCopyCname = () => {
    navigator.clipboard.writeText("cname.buildmora.com");
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
      tagline,
      footerText,
      contactEmail,
      defaultOgTitle,
      defaultOgDescription,
      defaultOgImage,
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
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
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
          { id: "general", label: "General", icon: Settings },
          { id: "seo", label: "SEO & OpenGraph", icon: Shield },
          { id: "analytics", label: "Analytics (GA4)", icon: BarChart3 },
          { id: "domain", label: "Custom Domain", icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* Tab 1: General Settings */}
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
              Public Contact Email
            </label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@yourdomain.com"
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

      {/* Tab 2: SEO Settings */}
      {activeTab === "seo" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Default OpenGraph Title
            </label>
            <Input
              value={defaultOgTitle}
              onChange={(e) => setDefaultOgTitle(e.target.value)}
              placeholder="Saurabh Kumar — Full Stack Engineer Portfolio"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Default Meta Description
            </label>
            <textarea
              value={defaultOgDescription}
              onChange={(e) => setDefaultOgDescription(e.target.value)}
              rows={3}
              placeholder="Discover projects, technical blogs, open source contributions, and software engineering services."
              className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Default OpenGraph Social Image URL
            </label>
            <Input
              value={defaultOgImage}
              onChange={(e) => setDefaultOgImage(e.target.value)}
              placeholder="https://buildmora-assets.s3.amazonaws.com/og-default.png"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Analytics Settings */}
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

      {/* Tab 4: Custom Domain Settings */}
      {activeTab === "domain" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-display text-foreground">
              Tenant Domain &amp; SSL Configuration
            </h3>
            <p className="text-xs text-muted-foreground">
              Every portfolio receives a free subdomain at{" "}
              <code className="text-primary font-mono">{initialSettings.siteSlug}.buildmora.com</code>.
            </p>
          </div>

          {/* Subdomain default indicator */}
          <div className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Default Subdomain</p>
              <p className="text-sm font-bold font-mono text-foreground">
                https://{initialSettings.siteSlug}.buildmora.com
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success flex items-center gap-1">
              <Check className="w-3 h-3" /> Active SSL
            </span>
          </div>

          {/* Custom Domain Input */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Custom Domain (Pro &amp; Enterprise Feature)
            </label>
            <div className="flex gap-2">
              <Input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="e.g. portfolio.yourname.com"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* DNS Configuration Instructions */}
          <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              DNS Configuration Instructions
            </h4>
            <p className="text-xs text-muted-foreground">
              To point your custom domain to BuildMora, add a <strong>CNAME</strong> record in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
            </p>

            <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-muted-foreground mr-4">Type: CNAME</span>
                <span className="text-muted-foreground mr-4">Host: @ / subdomain</span>
                <span className="text-foreground font-semibold">Target: cname.buildmora.com</span>
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
