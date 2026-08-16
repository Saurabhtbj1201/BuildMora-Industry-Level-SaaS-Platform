"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Check, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: Status;
  priority: Priority;
  adminNotes: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null } | null;
}

const STATUS_STYLE: Record<Status, string> = {
  OPEN:        "bg-rose-500/20 text-rose-400 border-rose-500/20",
  IN_PROGRESS: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  RESOLVED:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
  CLOSED:      "bg-slate-700/60 text-muted-foreground border-slate-600/30",
};

const PRIORITY_DOT: Record<Priority, string> = {
  URGENT: "bg-rose-500",
  HIGH:   "bg-orange-500",
  MEDIUM: "bg-amber-400",
  LOW:    "bg-slate-500",
};

export default function SupportTicketCard({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<Status>(ticket.status);
  const [priority, setPriority] = useState<Priority>(ticket.priority);
  const [notes, setNotes] = useState(ticket.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/super-admin/support/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priority, adminNotes: notes }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className={cn(
      "bg-card border rounded-2xl overflow-hidden transition-colors",
      expanded ? "border-violet-500/30" : "border-border hover:border-border"
    )}>
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        {/* Priority dot */}
        <div className={cn("w-2 h-2 rounded-full shrink-0 mt-0.5", PRIORITY_DOT[priority])} />

        {/* Subject + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {ticket.name} · {ticket.email} ·{" "}
            {new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        {/* Status badge */}
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", STATUS_STYLE[status])}>
          {status.replace("_", " ")}
        </span>

        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
          priority === "URGENT" ? "bg-rose-500/20 text-rose-300 border-rose-500/20" :
          priority === "HIGH" ? "bg-orange-500/20 text-orange-300 border-orange-500/20" :
          priority === "MEDIUM" ? "bg-amber-500/20 text-amber-300 border-amber-500/20" :
          "bg-slate-700/60 text-muted-foreground border-slate-600/30"
        )}>
          {priority}
        </span>

        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground/60 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/60 shrink-0" />}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border px-5 py-5 space-y-5">
          {/* Message */}
          <div className="bg-muted/30 border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Message from {ticket.name}
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                {(["OPEN","IN_PROGRESS","RESOLVED","CLOSED"] as Status[]).map((s) =>
                  <option key={s} value={s}>{s.replace("_"," ")}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                {(["URGENT","HIGH","MEDIUM","LOW"] as Priority[]).map((p) =>
                  <option key={p} value={p}>{p}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Admin Notes (internal)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add internal notes visible only to admins…"
              className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-foreground text-sm font-semibold rounded-xl transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              {saved ? "Saved!" : "Save Changes"}
            </button>
            <a href={`mailto:${ticket.email}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-muted/50 hover:bg-white/10 text-foreground text-sm rounded-xl transition-colors">
              <Mail className="w-3.5 h-3.5" /> Reply via Email
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
