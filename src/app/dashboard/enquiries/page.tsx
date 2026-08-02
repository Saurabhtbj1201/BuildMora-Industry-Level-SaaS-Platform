"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare, Filter, Loader2, RefreshCw, Trash2,
  Mail, Eye, MessageCircleReply, CheckCircle2, Archive,
  Phone, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  phone: string | null;
  source: string;
  status: "NEW" | "READ" | "REPLIED" | "RESOLVED" | "ARCHIVED";
  createdAt: string;
  project: { title: string } | null;
  osProject: { title: string } | null;
  service: { title: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  NEW:      { label: "New",      style: "bg-primary/10 text-primary border border-primary/20",     icon: Mail },
  READ:     { label: "Read",     style: "bg-muted text-muted-foreground border border-border",      icon: Eye },
  REPLIED:  { label: "Replied",  style: "bg-warning/10 text-warning border border-warning/20",     icon: MessageCircleReply },
  RESOLVED: { label: "Resolved", style: "bg-success/10 text-success border border-success/20",     icon: CheckCircle2 },
  ARCHIVED: { label: "Archived", style: "bg-muted text-muted-foreground border border-border",     icon: Archive },
};

const SOURCE_LABEL: Record<string, string> = {
  PROJECT: "Project", OPEN_SOURCE: "Open Source", BLOG: "Blog",
  SERVICE: "Service", COLLABORATION: "Collaboration",
};

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    const res = await fetch(`/api/enquiries?${params}`);
    const data = await res.json();
    setEnquiries(data.enquiries ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [statusFilter, sourceFilter]); // eslint-disable-line

  async function updateStatus(id: string, status: Enquiry["status"]) {
    setUpdating(id);
    await fetch(`/api/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
    setUpdating(null);
  }

  async function deleteEnquiry(id: string) {
    if (!confirm("Delete this enquiry?")) return;
    setUpdating(id);
    await fetch(`/api/enquiries/${id}`, { method: "DELETE" });
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    setUpdating(null);
  }

  const counts = {
    total: enquiries.length,
    NEW: enquiries.filter((e) => e.status === "NEW").length,
    REPLIED: enquiries.filter((e) => e.status === "REPLIED").length,
    RESOLVED: enquiries.filter((e) => e.status === "RESOLVED").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Enquiries
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage enquiries from visitors across your projects, services, and blog.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",    value: counts.total,    color: "text-foreground" },
          { label: "New",      value: counts.NEW,      color: "text-primary" },
          { label: "Replied",  value: counts.REPLIED,  color: "text-warning" },
          { label: "Resolved", value: counts.RESOLVED, color: "text-success" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center bg-muted/20">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex flex-wrap gap-2">
            {(["", "NEW", "READ", "REPLIED", "RESOLVED", "ARCHIVED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s ? STATUS_CONFIG[s]!.label : "All"}
              </button>
            ))}
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="ml-auto h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none"
          >
            <option value="">All Sources</option>
            {Object.entries(SOURCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">No enquiries found</h3>
            <p className="text-sm text-muted-foreground">Enquiries from your public pages will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {enquiries.map((enq) => {
              const cfg = STATUS_CONFIG[enq.status]!;
              const StatusIcon = cfg.icon;
              const isExpanded = expanded === enq.id;
              const context = enq.project?.title ?? enq.osProject?.title ?? enq.service?.title;

              return (
                <div key={enq.id} className="hover:bg-muted/20 transition-colors">
                  <div
                    className="p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : enq.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground font-display">{enq.name}</span>
                        <span className="text-xs text-muted-foreground">{enq.email}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${cfg.style}`}>
                          <StatusIcon className="w-2.5 h-2.5" />{cfg.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          {SOURCE_LABEL[enq.source] ?? enq.source}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {context ? `Re: ${context} · ` : ""}{enq.message.slice(0, 80)}{enq.message.length > 80 ? "…" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(enq.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 animate-fade-in border-t border-border/50 bg-muted/10">
                      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                          <a href={`mailto:${enq.email}`} className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />{enq.email}
                          </a>
                          {enq.phone && (
                            <p className="flex items-center gap-1.5 text-sm text-foreground">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />{enq.phone}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Update Status</p>
                          <div className="flex flex-wrap gap-2">
                            {(["NEW", "READ", "REPLIED", "RESOLVED", "ARCHIVED"] as const).map((s) => (
                              <button
                                key={s}
                                disabled={enq.status === s || updating === enq.id}
                                onClick={() => updateStatus(enq.id, s)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                                  enq.status === s ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"
                                } disabled:opacity-60`}
                              >
                                {STATUS_CONFIG[s]!.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-background border border-border rounded-lg p-3">
                          {enq.message}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Received {new Date(enq.createdAt).toLocaleString("en-IN")}
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => deleteEnquiry(enq.id)} disabled={updating === enq.id}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1">
                          {updating === enq.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
