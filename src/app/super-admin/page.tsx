import { requireSuperAdmin } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import {
  Users, Building2, ShieldAlert, LifeBuoy,
  TrendingUp, Zap, Activity, ArrowUpRight, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "Overview" };
export const revalidate = 0;

const PLAN_COLOR: Record<string, string> = {
  FREE:       "bg-slate-500/20 text-slate-400 border-slate-500/20",
  STARTER:    "bg-blue-500/20 text-blue-400 border-blue-500/20",
  PRO:        "bg-violet-500/20 text-violet-400 border-violet-500/20",
  ENTERPRISE: "bg-amber-500/20 text-amber-400 border-amber-500/20",
};

const ACTION_COLOR: Record<string, string> = {
  "project":     "text-blue-400",
  "blog":        "text-green-400",
  "service":     "text-amber-400",
  "user":        "text-violet-400",
  "tenant":      "text-cyan-400",
  "open-source": "text-emerald-400",
};

function actionColor(action: string) {
  const prefix = Object.keys(ACTION_COLOR).find((k) => action.startsWith(k));
  return prefix ? ACTION_COLOR[prefix] : "text-slate-400";
}

export default async function SuperAdminOverviewPage() {
  await requireSuperAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const currentMonth = now.toISOString().slice(0, 7);

  const [
    totalUsers, totalTenants, activeTenants,
    newUsers30d, newTenants30d, openSupport,
    planDist, aiUsage, auditLogs, urgentTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.tenant.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.supportRequest.count({ where: { status: "OPEN" } }),
    prisma.tenant.groupBy({ by: ["plan"], _count: { _all: true } }),
    prisma.aiCreditLedger.aggregate({
      where: { month: currentMonth },
      _sum: { used: true },
    }),
    prisma.auditLog.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.supportRequest.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      take: 5,
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      select: { id: true, subject: true, priority: true, status: true, createdAt: true, name: true },
    }),
  ]);

  const kpis = [
    {
      label: "Total Users",
      value: totalUsers.toLocaleString(),
      sub: `+${newUsers30d} in 30 days`,
      icon: Users,
      gradient: "from-violet-600 to-violet-800",
      glow: "shadow-violet-500/20",
    },
    {
      label: "Total Tenants",
      value: totalTenants.toLocaleString(),
      sub: `${activeTenants} active · +${newTenants30d} new`,
      icon: Building2,
      gradient: "from-blue-600 to-blue-800",
      glow: "shadow-blue-500/20",
    },
    {
      label: "Open Tickets",
      value: openSupport.toLocaleString(),
      sub: urgentTickets.length > 0 ? `${urgentTickets.length} urgent` : "All clear",
      icon: LifeBuoy,
      gradient: openSupport > 0 ? "from-rose-600 to-rose-800" : "from-emerald-600 to-emerald-800",
      glow: openSupport > 0 ? "shadow-rose-500/20" : "shadow-emerald-500/20",
    },
    {
      label: "AI Credits Used",
      value: (aiUsage._sum.used ?? 0).toLocaleString(),
      sub: `This month (${currentMonth})`,
      icon: Zap,
      gradient: "from-amber-600 to-amber-800",
      glow: "shadow-amber-500/20",
    },
  ];

  return (
    <div className="p-6 space-y-8 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-violet-400" />
          Platform Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label}
              className={cn("relative bg-[#0f1117] border border-white/[0.06] rounded-2xl p-5 overflow-hidden shadow-lg", kpi.glow)}>
              {/* Glow orb */}
              <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl", kpi.gradient)} />
              <div className="relative">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg", kpi.gradient)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold font-display text-white">{kpi.value}</p>
                <p className="text-sm font-medium text-slate-400 mt-0.5">{kpi.label}</p>
                <p className="text-xs text-slate-600 mt-1">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white font-display">Tenants by Plan</h2>
          </div>
          <div className="space-y-3">
            {["FREE","STARTER","PRO","ENTERPRISE"].map((plan) => {
              const found = planDist.find((p) => p.plan === plan);
              const count = found?._count._all ?? 0;
              const pct = totalTenants > 0 ? Math.round((count / totalTenants) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", PLAN_COLOR[plan])}>{plan}</span>
                    <span className="text-xs font-mono text-slate-400">{count} <span className="text-slate-600">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r transition-all",
                        plan === "FREE" ? "from-slate-500 to-slate-600" :
                        plan === "STARTER" ? "from-blue-500 to-blue-600" :
                        plan === "PRO" ? "from-violet-500 to-violet-600" : "from-amber-500 to-amber-600"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgent Tickets */}
        <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white font-display">Open Tickets</h2>
            </div>
            <a href="/super-admin/support" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {urgentTickets.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-600">No open tickets 🎉</div>
          ) : (
            <div className="space-y-2.5">
              {urgentTickets.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0",
                    t.priority === "HIGH" ? "bg-rose-500/20 text-rose-400" :
                    t.priority === "MEDIUM" ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-400"
                  )}>
                    {t.priority}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-white font-medium truncate">{t.subject}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{t.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-display">Recent Activity</h2>
            </div>
            <a href="/super-admin/audit-logs" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {auditLogs.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-600">No recent activity</div>
          ) : (
            <div className="space-y-2">
              {auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-mono font-medium truncate", actionColor(log.action))}>{log.action}</p>
                    <p className="text-[10px] text-slate-600 truncate">{log.user?.name ?? log.user?.email ?? "System"}</p>
                  </div>
                  <p className="text-[10px] text-slate-700 shrink-0">
                    {new Date(log.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Manage Users",   href: "/super-admin/users",      icon: Users,     color: "from-violet-600/20 to-violet-800/10 border-violet-500/15 hover:border-violet-500/30" },
          { label: "Manage Tenants", href: "/super-admin/tenants",    icon: Building2, color: "from-blue-600/20 to-blue-800/10 border-blue-500/15 hover:border-blue-500/30"       },
          { label: "Audit Logs",     href: "/super-admin/audit-logs", icon: Activity,  color: "from-cyan-600/20 to-cyan-800/10 border-cyan-500/15 hover:border-cyan-500/30"       },
          { label: "Support Queue",  href: "/super-admin/support",    icon: LifeBuoy,  color: "from-rose-600/20 to-rose-800/10 border-rose-500/15 hover:border-rose-500/30"       },
        ].map(({ label, href, icon: Icon, color }) => (
          <a key={href} href={href}
            className={cn("flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-br transition-all duration-150 group", color)}>
            <Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0" />
            <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">{label}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 ml-auto transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}
