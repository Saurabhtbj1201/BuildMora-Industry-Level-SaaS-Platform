"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CreditCard, Zap, Calendar, AlertTriangle, CheckCircle2,
  Clock, XCircle, TrendingUp, FolderGit2, BookOpen, Briefcase, Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanCard } from "@/components/billing/PlanCard";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { PLAN_LIMITS } from "@/lib/planLimits";
import { PLAN_PRICING } from "@/lib/billingConfig";
import { PLAN_FEATURES } from "@/lib/planLimits";
import type { PlanType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BillingPortal {
  plan: PlanType;
  subscription: {
    id: string;
    plan: PlanType;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  payments: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    createdAt: string;
    razorpayPaymentId: string | null;
  }[];
  usage: {
    projects: number;
    blogPosts: number;
    services: number;
    openSource: number;
    aiCredits: { used: number; limit: number };
  };
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  ACTIVE:    { label: "Active",       icon: CheckCircle2,  className: "text-green-600 bg-green-500/10" },
  PAST_DUE:  { label: "Past Due",     icon: AlertTriangle, className: "text-amber-600 bg-amber-500/10" },
  CANCELLED: { label: "Cancelled",    icon: XCircle,       className: "text-destructive bg-destructive/10" },
  TRIALING:  { label: "Trial",        icon: Clock,         className: "text-blue-600 bg-blue-500/10" },
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  captured: "text-green-600 bg-green-500/10",
  failed:   "text-destructive bg-destructive/10",
  refunded: "text-amber-600 bg-amber-500/10",
};

const PLANS_ORDER: PlanType[] = ["FREE", "STARTER", "PRO", "ENTERPRISE"];

// ─── Usage meter ─────────────────────────────────────────────────────────────
function UsageMeter({
  label, icon: Icon, used, limit, color,
}: {
  label: string; icon: React.ElementType; used: number; limit: number; color: string;
}) {
  const pct = limit === -1 ? 0 : Math.min(Math.round((used / limit) * 100), 100);
  const unlimited = limit === -1;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span className="text-xs text-muted-foreground">
          {unlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const { data: session } = useSession();
  const [data, setData]         = useState<BillingPortal | null>(null);
  const [loading, setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState<PlanType | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchPortal = () => {
    setLoading(true);
    fetch("/api/billing/portal")
      .then((r) => r.json())
      .then((d) => setData(d as BillingPortal))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPortal(); }, []);

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription at the end of the billing period?")) return;
    setCancelling(true);
    await fetch("/api/billing/cancel", { method: "POST" });
    setCancelling(false);
    fetchPortal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const sub      = data.subscription;
  const plan     = data.plan;
  const limits   = PLAN_LIMITS[plan];
  const status   = sub?.status ?? "ACTIVE";
  const statusCfg = STATUS_CONFIG[status] ?? {
    label: "Active", icon: CheckCircle2, className: "text-green-600 bg-green-500/10"
  };
  const StatusIcon = statusCfg.icon;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Billing & Subscription</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your plan, payments, and usage</p>
      </div>

      {/* ── Current plan + status ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Plan card */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Current Plan</p>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold font-display text-foreground capitalize">
                  {plan.charAt(0) + plan.slice(1).toLowerCase()}
                </h2>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", statusCfg.className)}>
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan === "FREE"
                  ? "Free plan — upgrade to unlock more features"
                  : PLAN_PRICING[plan].label + "/month"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
          </div>

          {sub && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Current period</p>
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {new Date(sub.currentPeriodStart).toLocaleDateString("en-IN")}
                    {" – "}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN")}
                  </p>
                </div>
                {sub.cancelAtPeriodEnd && (
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Cancels at period end</span>
                  </div>
                )}
              </div>

              {plan !== "FREE" && !sub.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="mt-3 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 underline underline-offset-2"
                >
                  {cancelling ? "Cancelling…" : "Cancel subscription"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Usage card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Usage this month
          </p>
          <UsageMeter label="Projects"    icon={FolderGit2} used={data.usage.projects}  limit={limits.projects}  color="bg-primary" />
          <UsageMeter label="Blog Posts"  icon={BookOpen}   used={data.usage.blogPosts} limit={limits.blogPosts} color="bg-blue-500" />
          <UsageMeter label="Services"    icon={Briefcase}  used={data.usage.services}  limit={limits.services}  color="bg-violet-500" />
          <UsageMeter label="Open Source" icon={Code2}      used={data.usage.openSource} limit={limits.openSource} color="bg-emerald-500" />
          <UsageMeter
            label="AI Credits"
            icon={Zap}
            used={data.usage.aiCredits.used}
            limit={limits.aiCredits === -1 ? -1 : data.usage.aiCredits.limit}
            color={
              data.usage.aiCredits.used / (data.usage.aiCredits.limit || 1) >= 0.9
                ? "bg-destructive"
                : "bg-amber-500"
            }
          />
        </div>
      </div>

      {/* ── Plan comparison ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold font-display text-foreground mb-4">Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS_ORDER.map((p) => (
            <PlanCard
              key={p}
              id={p}
              name={p.charAt(0) + p.slice(1).toLowerCase()}
              pricing={PLAN_PRICING[p]}
              features={PLAN_FEATURES[p]}
              popular={p === "PRO"}
              current={p === plan}
              cancelAtPeriodEnd={p === plan ? sub?.cancelAtPeriodEnd : undefined}
              onUpgrade={(selectedPlan) => setUpgrading(selectedPlan)}
            />
          ))}
        </div>
      </div>

      {/* ── Payment history ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold font-display text-foreground mb-4">Payment History</h2>
        {data.payments.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
            No payments yet. Upgrade to a paid plan to get started.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Date", "Description", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p, i) => (
                  <tr key={p.id} className={cn("border-b border-border/60 hover:bg-muted/30 transition-colors", i === data.payments.length - 1 && "border-0")}>
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-foreground">
                      {p.description ?? "Payment"}
                    </td>
                    <td className="px-5 py-3.5 text-foreground font-medium whitespace-nowrap">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", PAYMENT_STATUS_COLOR[p.status] ?? "text-muted-foreground bg-muted")}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Upgrade modal ─────────────────────────────────────────────────── */}
      {upgrading && (
        <UpgradeModal
          plan={upgrading}
          planLabel={upgrading.charAt(0) + upgrading.slice(1).toLowerCase()}
          userEmail={session?.user?.email ?? ""}
          userName={session?.user?.name ?? ""}
          onClose={() => { setUpgrading(null); fetchPortal(); }}
        />
      )}
    </div>
  );
}
