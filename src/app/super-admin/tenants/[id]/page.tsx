import { requireSuperAdmin } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, User, Zap, BarChart3, Globe, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import TenantActionButtons from "@/components/super-admin/TenantActionButtons";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "Tenant Detail" };
export const revalidate = 0;

const PLAN_BADGE: Record<string, string> = {
  FREE: "bg-slate-700/60 text-foreground border-slate-600/40",
  STARTER: "bg-blue-900/40 text-blue-300 border-blue-700/40",
  PRO: "bg-violet-900/40 text-violet-300 border-violet-700/40",
  ENTERPRISE: "bg-amber-900/40 text-amber-300 border-amber-700/40",
};

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true, siteName: true, siteSlug: true, plan: true, isActive: true,
      customDomain: true, customDomainVerified: true, createdAt: true, updatedAt: true,
      owner: { select: { id: true, name: true, email: true, isActive: true } },
      _count: { select: { projects: true, blogPosts: true, services: true, enquiries: true, contacts: true, openSourceProjects: true } },
      aiCreditLedgers: { orderBy: { month: "desc" }, take: 6 },
      subscription: true,
    },
  });

  if (!tenant) notFound();

  const subRecord = tenant.subscription as unknown as Record<string, string | null> | null;

  return (
    <div className="p-6 space-y-6 min-h-full max-w-5xl">
      <Link href="/super-admin/tenants"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-violet-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tenants
      </Link>

      {/* Header card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-foreground text-xl font-bold shadow-lg shadow-blue-500/20 shrink-0">
            {(tenant.siteName[0] ?? "T").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold font-display text-foreground">{tenant.siteName}</h1>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", PLAN_BADGE[tenant.plan])}>
                {tenant.plan}
              </span>
              <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                tenant.isActive
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/20 text-rose-400 border-rose-500/20")}>
                {tenant.isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                {tenant.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{tenant.siteSlug}.buildmora.com</p>
            {tenant.customDomain && (
              <p className="text-xs text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                <Globe className="w-3 h-3" /> {tenant.customDomain}
                {tenant.customDomainVerified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              </p>
            )}
          </div>
          <TenantActionButtons tenantId={id} currentPlan={tenant.plan} isActive={tenant.isActive} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owner */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-foreground font-display">Owner</h2>
            <Link href={`/super-admin/users/${tenant.owner.id}`}
              className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors">View user →</Link>
          </div>
          {[
            { label: "Name", value: tenant.owner.name ?? "—" },
            { label: "Email", value: tenant.owner.email, mono: true },
            { label: "Account Status", value: tenant.owner.isActive ? "Active" : "Disabled" },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between text-sm border-b border-border/60 pb-2 last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className={cn("font-medium", mono ? "font-mono text-xs text-foreground" : "text-foreground")}>{value}</span>
            </div>
          ))}
        </div>

        {/* Content counts */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-foreground font-display">Content Overview</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(tenant._count).map(([key, val]) => (
              <div key={key} className="bg-muted/30 border border-border rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground font-display">{val as number}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5 capitalize">
                  {key.replace("Posts","").replace("openSource","OS ").replace("Projects","Proj.")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Credits */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-foreground font-display">AI Credit History</h2>
        </div>
        {tenant.aiCreditLedgers.length === 0 ? (
          <p className="text-sm text-muted-foreground/60">No AI credit records</p>
        ) : (
          <div className="space-y-3">
            {tenant.aiCreditLedgers.map((l: { month: string; used: number; limit: number }) => {
              const pct = l.limit > 0 ? Math.min(100, Math.round((l.used / l.limit) * 100)) : 0;
              return (
                <div key={l.month}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-muted-foreground">{l.month}</span>
                    <span className="text-foreground font-semibold">{l.used} <span className="text-muted-foreground/60">/ {l.limit === -1 ? "∞" : l.limit}</span></span>
                  </div>
                  {l.limit > 0 && (
                    <div className="h-2 bg-muted/50 rounded-full">
                      <div className={cn("h-full rounded-full transition-all",
                        pct > 80 ? "bg-gradient-to-r from-rose-500 to-rose-600" :
                        pct > 50 ? "bg-gradient-to-r from-amber-500 to-amber-600" :
                        "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscription */}
      {subRecord && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-foreground font-display">Subscription</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Status", value: subRecord.status ?? "—" },
              { label: "Razorpay Sub ID", value: subRecord.razorpaySubId ?? subRecord.razorpaySubscriptionId ?? "—", mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="bg-muted/30 rounded-xl p-3">
                <p className="text-muted-foreground text-xs mb-1">{label}</p>
                <p className={cn("font-medium text-foreground", mono ? "font-mono text-xs" : "")}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
