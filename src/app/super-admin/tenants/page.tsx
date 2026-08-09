import { requireSuperAdmin } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Search, ChevronRight, CheckCircle2, XCircle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tenants" };
export const revalidate = 0;

const PLAN_BADGE: Record<string, string> = {
  FREE: "bg-slate-700/60 text-slate-300 border-slate-600/40",
  STARTER: "bg-blue-900/40 text-blue-300 border-blue-700/40",
  PRO: "bg-violet-900/40 text-violet-300 border-violet-700/40",
  ENTERPRISE: "bg-amber-900/40 text-amber-300 border-amber-700/40",
};

export default async function SuperAdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; plan?: string; active?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const search = sp.search ?? "";
  const plan = sp.plan ?? "";
  const active = sp.active;
  const limit = 20;

  const where = {
    ...(plan ? { plan: plan as "FREE" | "STARTER" | "PRO" | "ENTERPRISE" } : {}),
    ...(active !== undefined ? { isActive: active === "true" } : {}),
    ...(search ? {
      OR: [
        { siteName: { contains: search, mode: "insensitive" as const } },
        { siteSlug: { contains: search, mode: "insensitive" as const } },
        { owner: { email: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {}),
  };

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, siteName: true, siteSlug: true, plan: true,
        isActive: true, customDomain: true, createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { projects: true, blogPosts: true, services: true } },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-400" />
            Tenants
          </h1>
          <p className="text-sm text-slate-500 mt-1">{total.toLocaleString()} total sites</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input name="search" defaultValue={search} placeholder="Search site or owner email…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500" />
        </div>
        <select name="plan" defaultValue={plan}
          className="px-3 py-2.5 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
          <option value="">All Plans</option>
          {["FREE","STARTER","PRO","ENTERPRISE"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="active" defaultValue={active ?? ""}
          className="px-3 py-2.5 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button type="submit" className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">Filter</button>
      </form>

      {/* Table */}
      <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Site","Owner","Plan","Content","Status","Domain","Joined",""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {tenants.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-600">No tenants found</td></tr>
              ) : tenants.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{t.siteName}</p>
                    <p className="text-xs text-slate-500 font-mono">{t.siteSlug}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-300 truncate max-w-[160px]">{t.owner.name ?? "—"}</p>
                    <p className="text-xs text-slate-600 truncate max-w-[160px]">{t.owner.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", PLAN_BADGE[t.plan])}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span>{t._count.projects}P</span>
                      <span>{t._count.blogPosts}B</span>
                      <span>{t._count.services}S</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("flex items-center gap-1 text-xs font-medium",
                      t.isActive ? "text-emerald-400" : "text-rose-400")}>
                      {t.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {t.customDomain ? (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Globe className="w-3 h-3" /> {t.customDomain}
                      </span>
                    ) : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/super-admin/tenants/${t.id}`}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
            <p className="text-xs text-slate-500">Showing {(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}</p>
            <div className="flex gap-2">
              {page > 1 && <Link href={`?page=${page-1}&search=${search}&plan=${plan}`} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">← Prev</Link>}
              {page < pages && <Link href={`?page=${page+1}&search=${search}&plan=${plan}`} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">Next →</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
