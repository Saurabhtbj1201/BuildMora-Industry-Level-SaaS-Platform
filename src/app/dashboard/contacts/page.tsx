"use client";

import { useState, useEffect } from "react";
import {
  Mail, Filter, Loader2, RefreshCw, Trash2,
  CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "RESOLVED" | "ARCHIVED";
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  NEW:      { label: "New",      style: "bg-primary/10 text-primary border border-primary/20",   icon: Mail },
  READ:     { label: "Read",     style: "bg-muted text-muted-foreground border border-border",    icon: Mail },
  REPLIED:  { label: "Replied",  style: "bg-warning/10 text-warning border border-warning/20",   icon: Clock },
  RESOLVED: { label: "Resolved", style: "bg-success/10 text-success border border-success/20",   icon: CheckCircle2 },
  ARCHIVED: { label: "Archived", style: "bg-muted text-muted-foreground border border-border",   icon: XCircle },
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"" | "NEW" | "READ" | "REPLIED" | "RESOLVED" | "ARCHIVED">("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/contacts${filter ? `?status=${filter}` : ""}`);
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  async function updateStatus(id: string, status: Contact["status"]) {
    setUpdating(id);
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    setUpdating(null);
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact message?")) return;
    setUpdating(id);
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setUpdating(null);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Contacts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Direct messages sent via your public contact page.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["", "NEW", "READ", "REPLIED", "RESOLVED", "ARCHIVED"] as const).map((s) => {
              const count = s ? contacts.filter((c) => c.status === s).length : contacts.length;
              const label = s ? STATUS_CONFIG[s]!.label : "Total";
          return (
            <div key={s || "total"} className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold font-display text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Filter bar */}
        <div className="p-4 border-b border-border flex flex-wrap gap-2 items-center bg-muted/20">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {(["", "NEW", "READ", "REPLIED", "RESOLVED", "ARCHIVED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s ? STATUS_CONFIG[s]!.label : "All"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">No messages yet</h3>
            <p className="text-sm text-muted-foreground">Contact messages from your public site will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {contacts.map((contact) => {
              const cfg = STATUS_CONFIG[contact.status]!;
              const StatusIcon = cfg.icon;
              const isOpen = expanded === contact.id;

              return (
                <div key={contact.id} className="hover:bg-muted/20 transition-colors">
                  <div
                    className="p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : contact.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground font-display">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">{contact.email}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${cfg.style}`}>
                          <StatusIcon className="w-2.5 h-2.5" />{cfg.label}
                        </span>
                      </div>
                      {contact.subject && (
                        <p className="text-xs font-medium text-foreground mt-0.5">{contact.subject}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {contact.message.slice(0, 90)}{contact.message.length > 90 ? "…" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(contact.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border/50 bg-muted/10 animate-fade-in">
                      <div className="pt-4 space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-background border border-border rounded-lg p-3">
                          {contact.message}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Update Status</p>
                        <div className="flex flex-wrap gap-2">
                          {(["NEW", "READ", "REPLIED", "RESOLVED", "ARCHIVED"] as const).map((s) => (
                            <button
                              key={s}
                              disabled={contact.status === s || updating === contact.id}
                              onClick={() => updateStatus(contact.id, s)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                                contact.status === s
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground"
                              } disabled:opacity-60`}
                            >
                              {STATUS_CONFIG[s]!.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-3">
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" /> Reply via Email
                          </a>
                        </div>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => deleteContact(contact.id)}
                          disabled={updating === contact.id}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
                        >
                          {updating === contact.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
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
