import { requireSuperAdmin } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { Users, Search, ShieldAlert, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";


export const metadata: Metadata = { title: "Users" };
export const revalidate = 0;

const PLAN_BADGE: Record<string, string> = {
  FREE: "bg-slate-700/60 text-slate-300 border-slate-600/40",
  STARTER: "bg-blue-900/40 text-blue-300 border-blue-700/40",
  PRO: "bg-violet-900/40 text-violet-300 border-violet-700/40",
  ENTERPRISE: "bg-amber-900/40 text-amber-300 border-amber-700/40",
};

export default async function SuperAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; active?: string; superAdmin?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const search = sp.search ?? "";
  const activeFilter = sp.active;
  const superAdminFilter = sp.superAdmin;
  const limit = 20;

  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(activeFilter !== undefined ? { isActive: activeFilter === "true" } : {}),
    ...(superAdminFilter !== undefined ? { isSuperAdmin: superAdminFilter === "true" } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, image: true,
        isActive: true, isSuperAdmin: true, emailVerified: true, createdAt: true,
        tenant: { select: { siteName: true, siteSlug: true, plan: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-violet-400" />
            Users
          </h1>
          <p className="text-sm text-slate-500 mt-1">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select name="active" defaultValue={activeFilter ?? ""}
          className="px-3 py-2.5 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>
        <select name="superAdmin" defaultValue={superAdminFilter ?? ""}
          className="px-3 py-2.5 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
          <option value="">All Roles</option>
          <option value="true">Super Admin</option>
          <option value="false">Regular User</option>
        </select>
        <button type="submit"
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["User", "Plan", "Status", "Role", "Joined", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-600">No users found</td></tr>
              ) : users.map((u: (typeof users)[number]) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                        {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : (u.name?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{u.name ?? "—"}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {u.tenant ? (
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", PLAN_BADGE[u.tenant.plan])}>
                        {u.tenant.plan}
                      </span>
                    ) : <span className="text-slate-600 text-xs">No site</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("flex items-center gap-1.5 text-xs font-medium",
                      u.isActive ? "text-emerald-400" : "text-rose-400")}>
                      {u.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.isSuperAdmin ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-violet-400">
                        <ShieldAlert className="w-3.5 h-3.5" /> Super Admin
                      </span>
                    ) : <span className="text-xs text-slate-600">User</span>}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/super-admin/users/${u.id}`}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?page=${page - 1}&search=${search}`}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
                  ← Prev
                </Link>
              )}
              {page < pages && (
                <Link href={`?page=${page + 1}&search=${search}`}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
