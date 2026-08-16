import { requireSuperAdmin } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "Audit Logs" };
export const revalidate = 0;

const ACTION_CATEGORY: Record<string, { color: string; bg: string }> = {
  project:      { color: "text-blue-400",    bg: "bg-blue-500/10"    },
  blog:         { color: "text-green-400",   bg: "bg-green-500/10"   },
  service:      { color: "text-amber-400",   bg: "bg-amber-500/10"   },
  user:         { color: "text-violet-400",  bg: "bg-violet-500/10"  },
  tenant:       { color: "text-cyan-400",    bg: "bg-cyan-500/10"    },
  "open-source":{ color: "text-emerald-400", bg: "bg-emerald-500/10" },
  review:       { color: "text-pink-400",    bg: "bg-pink-500/10"    },
  enquiry:      { color: "text-orange-400",  bg: "bg-orange-500/10"  },
};

function getCategory(action: string) {
  return Object.entries(ACTION_CATEGORY).find(([k]) => action.startsWith(k))?.[1]
    ?? { color: "text-muted-foreground", bg: "bg-slate-500/10" };
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; userId?: string; from?: string; to?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const action = sp.action ?? "";
  const userId = sp.userId ?? "";
  const from = sp.from ?? "";
  const to = sp.to ?? "";
  const limit = 30;

  const where = {
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(userId ? { userId } : {}),
    ...(from || to ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + "T23:59:59Z") } : {}),
      },
    } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2.5">
          <ScrollText className="w-6 h-6 text-cyan-400" />
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} events recorded</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-center">
        <div className="relative min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input name="action" defaultValue={action} placeholder="Action (e.g. project.created)…"
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <input name="from" type="date" defaultValue={from}
          className="px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        <span className="text-muted-foreground/60 text-xs">to</span>
        <input name="to" type="date" defaultValue={to}
          className="px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        <button type="submit" className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-foreground text-sm font-medium rounded-xl transition-colors">Filter</button>
        {(action || from || to) && (
          <Link href="/super-admin/audit-logs" className="px-4 py-2.5 bg-muted/50 hover:bg-white/10 text-muted-foreground text-sm rounded-xl transition-colors">Clear</Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Timestamp","Action","Entity","User","IP"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-muted-foreground/60">No audit logs found</td></tr>
              ) : logs.map((log) => {
                const cat = getCategory(log.action);
                return (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs font-mono font-semibold px-2 py-0.5 rounded-full", cat.color, cat.bg)}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">
                      {log.entity ? `${log.entity}${log.entityId ? `:${log.entityId.slice(0, 8)}` : ""}` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.user ? (
                        <Link href={`/super-admin/users/${log.user.id}`}
                          className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                          {log.user.name ?? log.user.email}
                        </Link>
                      ) : <span className="text-xs text-muted-foreground/60">System</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground/60 font-mono">{log.ipAddress ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}</p>
            <div className="flex gap-2">
              {page > 1 && <Link href={`?page=${page-1}&action=${action}&from=${from}&to=${to}`} className="px-3 py-1.5 text-xs rounded-lg bg-muted/50 text-foreground hover:bg-white/10 transition-colors">← Prev</Link>}
              {page < pages && <Link href={`?page=${page+1}&action=${action}&from=${from}&to=${to}`} className="px-3 py-1.5 text-xs rounded-lg bg-muted/50 text-foreground hover:bg-white/10 transition-colors">Next →</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
