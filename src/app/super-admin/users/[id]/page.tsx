import { requireSuperAdmin } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft, Building2, Zap, Activity,
  ShieldAlert, CheckCircle2, XCircle, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UserActionButtons from "@/components/super-admin/UserActionButtons";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "User Detail" };
export const revalidate = 0;

const ACTION_COLOR: Record<string, string> = {
  project: "text-blue-400", blog: "text-green-400", service: "text-amber-400",
  user: "text-violet-400", tenant: "text-cyan-400",
};
function actionColor(a: string) {
  return Object.entries(ACTION_COLOR).find(([k]) => a.startsWith(k))?.[1] ?? "text-slate-400";
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, image: true,
      isActive: true, isSuperAdmin: true, emailVerified: true, createdAt: true,
      tenant: {
        select: {
          id: true, siteName: true, siteSlug: true, plan: true, isActive: true,
          customDomain: true, customDomainVerified: true, createdAt: true,
          _count: { select: { projects: true, blogPosts: true, services: true, enquiries: true } },
          aiCreditLedgers: { orderBy: { month: "desc" }, take: 3 },
        },
      },
      auditLogs: {
        take: 10, orderBy: { createdAt: "desc" },
        select: { id: true, action: true, entity: true, createdAt: true, ipAddress: true },
      },
    },
  });

  if (!user) notFound();

  const isSelf = session.user?.id === id;

  return (
    <div className="p-6 space-y-6 min-h-full max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/super-admin/users"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Users
        </Link>
      </div>

      {/* Profile card */}
      <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden shadow-lg shadow-violet-500/20">
            {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : (user.name?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold font-display text-white">{user.name ?? "Unknown"}</h1>
              {user.isSuperAdmin && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20">
                  <ShieldAlert className="w-2.5 h-2.5" /> SUPER ADMIN
                </span>
              )}
              <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                user.isActive
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/20 text-rose-400 border-rose-500/20")}>
                {user.isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                {user.isActive ? "ACTIVE" : "DISABLED"}
              </span>
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user.email}</p>
            <p className="text-xs text-slate-600 mt-1">
              Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              {user.emailVerified && " · Email verified"}
            </p>
          </div>
          <UserActionButtons
            userId={id}
            isActive={user.isActive}
            isSuperAdmin={user.isSuperAdmin}
            isSelf={isSelf}
            tenantId={user.tenant?.id}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant info */}
        {user.tenant ? (
          <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white font-display">Site / Tenant</h2>
              <Link href={`/super-admin/tenants/${user.tenant.id}`}
                className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors">View →</Link>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Site Name", value: user.tenant.siteName },
                { label: "Slug", value: user.tenant.siteSlug, mono: true },
                { label: "Plan", value: user.tenant.plan },
                { label: "Custom Domain", value: user.tenant.customDomain ?? "—", mono: true },
                { label: "Site Active", value: user.tenant.isActive ? "Yes" : "No" },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className={cn("font-medium", mono ? "font-mono text-slate-300 text-xs" : "text-white")}>{value}</span>
                </div>
              ))}
            </div>
            {/* Content counts */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
              {Object.entries(user.tenant._count).map(([key, val]) => (
                <div key={key} className="text-center p-2 bg-white/[0.03] rounded-lg">
                  <p className="text-base font-bold text-white">{val as number}</p>
                  <p className="text-[10px] text-slate-600 capitalize">{key.replace("Posts", "")}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-center text-slate-600 text-sm">
            No tenant / site yet
          </div>
        )}

        {/* AI Credits */}
        <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white font-display">AI Credits</h2>
          </div>
          {user.tenant?.aiCreditLedgers.length ? user.tenant.aiCreditLedgers.map((l: { month: string; used: number; limit: number }) => {
            const pct = l.limit > 0 ? Math.min(100, Math.round((l.used / l.limit) * 100)) : 0;
            return (
              <div key={l.month} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">{l.month}</span>
                  <span className="text-white font-semibold">{l.used} / {l.limit === -1 ? "∞" : l.limit}</span>
                </div>
                {l.limit > 0 && (
                  <div className="h-1.5 bg-white/5 rounded-full">
                    <div className={cn("h-full rounded-full", pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500")}
                      style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          }) : <p className="text-sm text-slate-600">No AI credit records</p>}
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white font-display">Recent Audit Activity</h2>
        </div>
        {user.auditLogs.length === 0 ? (
          <p className="text-sm text-slate-600 py-4 text-center">No audit logs for this user</p>
        ) : (
          <div className="space-y-0">
            {user.auditLogs.map((log: { id: string; action: string; entity: string | null; ipAddress: string | null; createdAt: Date }) => (
              <div key={log.id} className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                <span className={cn("text-xs font-mono font-medium flex-1", actionColor(log.action))}>{log.action}</span>
                <span className="text-xs text-slate-600">{log.entity ?? "—"}</span>
                <span className="text-xs text-slate-600 font-mono">{log.ipAddress ?? "—"}</span>
                <span className="text-xs text-slate-700">
                  {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
