"use client";

import { Check, Zap, Crown, Building2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanType } from "@prisma/client";

interface PlanCardProps {
  id: PlanType;
  name: string;
  pricing: { price: number; label: string };
  features: string[];
  popular?: boolean;
  current?: boolean;
  onUpgrade?: (plan: PlanType) => void;
  loading?: boolean;
  cancelAtPeriodEnd?: boolean;
}

const PLAN_ICONS: Record<PlanType, React.ElementType> = {
  FREE:       Zap,
  STARTER:    Rocket,
  PRO:        Crown,
  ENTERPRISE: Building2,
};

const PLAN_GRADIENTS: Record<PlanType, string> = {
  FREE:       "from-muted to-muted/50",
  STARTER:    "from-blue-500/20 to-blue-600/10",
  PRO:        "from-violet-500/20 to-violet-600/10",
  ENTERPRISE: "from-amber-500/20 to-amber-600/10",
};

const PLAN_ICON_BG: Record<PlanType, string> = {
  FREE:       "bg-muted text-muted-foreground",
  STARTER:    "bg-blue-500/10 text-blue-500",
  PRO:        "bg-violet-500/10 text-violet-500",
  ENTERPRISE: "bg-amber-500/10 text-amber-500",
};

const PLAN_BORDER: Record<PlanType, string> = {
  FREE:       "border-border",
  STARTER:    "border-blue-500/20",
  PRO:        "border-violet-500/30",
  ENTERPRISE: "border-amber-500/20",
};

export function PlanCard({
  id,
  name,
  pricing,
  features,
  popular,
  current,
  onUpgrade,
  loading,
  cancelAtPeriodEnd,
}: PlanCardProps) {
  const Icon = PLAN_ICONS[id];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-all duration-200",
        PLAN_BORDER[id],
        popular
          ? "shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30"
          : "hover:border-border/80 hover:shadow-md"
      )}
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-40 pointer-events-none", PLAN_GRADIENTS[id])} />

      <div className="relative">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", PLAN_ICON_BG[id])}>
          <Icon className="w-5 h-5" />
        </div>

        <h3 className="text-base font-bold text-foreground font-display">{name}</h3>
        <div className="mt-1 mb-4">
          {pricing.price === 0 ? (
            <span className="text-2xl font-bold text-foreground">Free</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                ₹{pricing.price.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-muted-foreground">/month</span>
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {current ? (
          <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-primary/10 text-primary border border-primary/20">
            {cancelAtPeriodEnd ? "Cancels at period end" : "Current Plan"}
          </div>
        ) : id === "FREE" ? (
          <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium text-muted-foreground bg-muted border border-border">
            Downgrade by cancelling
          </div>
        ) : id === "ENTERPRISE" ? (
          <a
            href="mailto:support@buildmora.tech"
            className="block w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            Contact Sales
          </a>
        ) : (
          <button
            onClick={() => onUpgrade?.(id)}
            disabled={loading}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
              popular
                ? "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-500/25"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {loading ? "Processing…" : `Upgrade to ${name}`}
          </button>
        )}
      </div>
    </div>
  );
}
