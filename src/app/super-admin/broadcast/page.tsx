"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Users,
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Mail,
  History,
  ShieldCheck,
} from "lucide-react";

interface AudienceCounts {
  ALL: number;
  TENANTS: number;
  PLAN_FREE: number;
  PLAN_STARTER: number;
  PLAN_PRO: number;
  PLAN_ENTERPRISE: number;
}

interface BroadcastHistoryItem {
  id: string;
  createdAt: string;
  newValue: {
    subject?: string;
    heading?: string;
    target?: string;
    totalRecipients?: number;
    totalSent?: number;
    totalFailed?: number;
  };
}

export default function SuperAdminBroadcastPage() {
  const [counts, setCounts] = useState<AudienceCounts>({
    ALL: 0,
    TENANTS: 0,
    PLAN_FREE: 0,
    PLAN_STARTER: 0,
    PLAN_PRO: 0,
    PLAN_ENTERPRISE: 0,
  });
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [target, setTarget] = useState<
    "ALL" | "TENANTS" | "PLAN_FREE" | "PLAN_STARTER" | "PLAN_PRO" | "PLAN_ENTERPRISE" | "CUSTOM"
  >("ALL");
  const [customEmails, setCustomEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [message, setMessage] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  // Sending state
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    totalSent?: number;
    totalFailed?: number;
    totalRecipients?: number;
    error?: string;
  } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/super-admin/broadcast");
      const data = await res.json();
      if (res.ok) {
        if (data.counts) setCounts(data.counts);
        if (data.recentBroadcasts) setHistory(data.recentBroadcasts);
      }
    } catch (err) {
      console.error("Failed to load broadcast stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSendTest = async () => {
    if (!subject || !heading || !message) {
      alert("Please fill in subject, heading, and message before sending a test.");
      return;
    }
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/super-admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `[TEST] ${subject}`,
          heading,
          message,
          ctaText: ctaText || undefined,
          ctaUrl: ctaUrl || undefined,
          target: "TEST",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send test");
      alert("Test email dispatched to your admin email address!");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error sending test email");
    } finally {
      setTesting(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!subject || !heading || !message) {
      alert("Please fill in subject, heading, and message.");
      return;
    }

    const recipientCount =
      target === "CUSTOM"
        ? customEmails.split(",").filter((e) => e.trim().length > 0).length
        : counts[target];

    const confirmed = window.confirm(
      `Are you sure you want to send this broadcast to approximately ${recipientCount} recipient(s)?`
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);

    try {
      const parsedCustom =
        target === "CUSTOM"
          ? customEmails
              .split(",")
              .map((e) => e.trim())
              .filter((e) => e.length > 0)
          : undefined;

      const res = await fetch("/api/super-admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          heading,
          message,
          ctaText: ctaText || undefined,
          ctaUrl: ctaUrl || undefined,
          target,
          customEmails: parsedCustom,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Broadcast delivery failed");

      setResult({
        success: true,
        totalSent: data.totalSent,
        totalFailed: data.totalFailed,
        totalRecipients: data.totalRecipients,
      });

      fetchStats();
    } catch (err: unknown) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Error broadcasting email",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-400 mb-2">
            <Mail className="w-3.5 h-3.5" /> Email Delivery Service
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
            Super Admin Broadcast
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Send bulk newsletters, feature updates, and platform announcements directly through Amazon SES.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border px-3.5 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SES Production Active: <strong>buildmora.tech</strong></span>
        </div>
      </div>

      {result && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
            result.success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div>
            {result.success ? (
              <>
                <p className="font-semibold text-base">Broadcast Dispatched Successfully!</p>
                <p className="mt-1">
                  Sent: <strong>{result.totalSent}</strong> &bull; Failed:{" "}
                  <strong>{result.totalFailed}</strong> &bull; Target:{" "}
                  <strong>{result.totalRecipients}</strong>
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-base">Broadcast Failed</p>
                <p className="mt-1">{result.error}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Audience Selection Cards ── */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
          1. Select Target Audience
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: "ALL", label: "All Users", count: counts.ALL, icon: Users },
            { id: "TENANTS", label: "Tenant Owners", count: counts.TENANTS, icon: Building2 },
            { id: "PLAN_FREE", label: "Free Tier", count: counts.PLAN_FREE, icon: Sparkles },
            { id: "PLAN_STARTER", label: "Starter Tier", count: counts.PLAN_STARTER, icon: Sparkles },
            { id: "PLAN_PRO", label: "Pro Tier", count: counts.PLAN_PRO, icon: Sparkles },
            { id: "CUSTOM", label: "Custom Emails", count: null, icon: Mail },
          ].map((item) => {
            const isSelected = target === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTarget(item.id as typeof target)}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-card border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mb-2 ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
                <p className="text-lg font-bold font-display text-foreground mt-0.5">
                  {loading ? "..." : item.count !== null ? item.count : "Custom"}
                </p>
              </button>
            );
          })}
        </div>

        {target === "CUSTOM" && (
          <div className="mt-3 p-4 bg-card border border-border rounded-xl">
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Enter Email Addresses (comma separated)
            </label>
            <input
              type="text"
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              placeholder="user1@example.com, user2@example.com"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}
      </div>

      {/* ── Email Composition & Live Preview Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Compose Form */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
          <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> 2. Compose Email Content
          </h2>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Introducing Custom Domains on BuildMora!"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Main Heading (Inside Email)
            </label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="e.g. Supercharge your brand with custom domains"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Message Body
            </label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement or update here. Separate paragraphs with a blank line..."
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                CTA Button Text (Optional)
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Explore Features"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                CTA Button URL (Optional)
              </label>
              <input
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://www.buildmora.tech/dashboard"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testing || sending}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold transition-all disabled:opacity-50"
            >
              {testing ? "Sending Test..." : "Send Test to My Email"}
            </button>

            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={sending || testing}
              className="w-full sm:flex-1 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              {sending ? (
                <>Broadcasting...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Broadcast to{" "}
                  {target === "CUSTOM"
                    ? "Custom List"
                    : `${counts[target] ?? 0} Recipients`}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Live Interactive Inbox Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-400" /> 3. Inbox Live Preview
            </h2>
            <span className="text-xs text-muted-foreground">Renders BuildMora Design System</span>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 border border-border rounded-2xl p-6 sm:p-8">
            <div className="max-w-md mx-auto bg-white text-slate-800 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Email Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  B
                </div>
                <span className="font-bold text-slate-900 text-base">BuildMora</span>
              </div>

              {/* Email Content */}
              <div className="p-6 space-y-4">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 uppercase tracking-wide">
                  Platform Announcement
                </span>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {heading || "Your Email Heading Will Appear Here"}
                </h3>

                <div className="text-sm text-slate-600 leading-relaxed space-y-2 whitespace-pre-wrap">
                  {message ||
                    "This is a live preview of how your email message will appear to recipients in their Gmail, Apple Mail, or Outlook inbox."}
                </div>

                {ctaText && ctaUrl && (
                  <div className="pt-3">
                    <span className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold shadow-sm">
                      {ctaText} &rarr;
                    </span>
                  </div>
                )}
              </div>

              {/* Email Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
                &copy; {new Date().getFullYear()} BuildMora &bull; buildmora.tech
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Broadcast History ── */}
      {history.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" /> Recent Broadcast History
          </h2>
          <div className="divide-y divide-border overflow-x-auto">
            {history.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-semibold text-foreground">
                    {item.newValue?.subject || "Announcement"}
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Target: <strong>{item.newValue?.target}</strong> &bull; Sent on{" "}
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[11px]">
                    {item.newValue?.totalSent ?? 0} Delivered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
