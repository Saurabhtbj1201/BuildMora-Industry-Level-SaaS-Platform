import { requireSuperAdmin } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import SupportTicketCard from "@/components/super-admin/SupportTicketCard";

export const metadata: Metadata = { title: "Support" };
export const revalidate = 0;

const STATUS_STYLE: Record<string, string> = {
  OPEN:        "bg-rose-500/20 text-rose-400 border-rose-500/20",
  IN_PROGRESS: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  RESOLVED:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
  CLOSED:      "bg-slate-700/60 text-slate-400 border-slate-600/40",
};

const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: "bg-rose-600/30 text-rose-300 border-rose-600/30",
  HIGH:     "bg-orange-500/20 text-orange-400 border-orange-500/20",
  MEDIUM:   "bg-amber-500/20 text-amber-400 border-amber-500/20",
  LOW:      "bg-slate-700/40 text-slate-400 border-slate-600/40",
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; priority?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const status = sp.status ?? "";
  const priority = sp.priority ?? "";
  const limit = 20;

  const where = {
    ...(status ? { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" } : {}),
    ...(priority ? { priority: priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" } : {}),
  };

  // Status counts for header badges
  const [statusCounts, tickets, total] = await Promise.all([
    prisma.supportRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.supportRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.supportRequest.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);
  const countMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
          <LifeBuoy className="w-6 h-6 text-rose-400" />
          Support Requests
        </h1>
        <p className="text-sm text-slate-500 mt-1">{total.toLocaleString()} total tickets</p>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {["OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map((s) => (
          <Link key={s} href={`/super-admin/support?status=${s}`}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
              status === s ? STATUS_STYLE[s] + " ring-1 ring-offset-0" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
            )}>
            {s.replace("_"," ")}
            <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">{countMap[s] ?? 0}</span>
          </Link>
        ))}
        {(status || priority) && (
          <Link href="/super-admin/support"
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">× Clear</Link>
        )}
      </div>

      {/* Priority filter */}
      <form method="GET" className="flex flex-wrap gap-3 items-center">
        <input type="hidden" name="status" value={status} />
        <select name="priority" defaultValue={priority}
          className="px-3 py-2.5 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
          <option value="">All Priorities</option>
          {["CRITICAL","HIGH","MEDIUM","LOW"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="submit" className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">Apply</button>
      </form>

      {/* Tickets */}
      {tickets.length === 0 ? (
        <div className="text-center py-20 text-slate-600 bg-[#0f1117] border border-white/[0.06] rounded-2xl">
          No tickets found
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <SupportTicketCard
              key={ticket.id}
              ticket={{
                id: ticket.id,
                name: ticket.name,
                email: ticket.email,
                subject: ticket.subject,
                message: ticket.message,
                status: ticket.status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED",
                priority: ticket.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
                adminNotes: ticket.adminNotes,
                createdAt: ticket.createdAt.toISOString(),
                user: ticket.user,
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`?page=${page-1}&status=${status}&priority=${priority}`} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">← Prev</Link>}
            {page < pages && <Link href={`?page=${page+1}&status=${status}&priority=${priority}`} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">Next →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
