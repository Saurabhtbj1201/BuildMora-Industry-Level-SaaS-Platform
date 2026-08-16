"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Zap, PowerOff, PowerIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = ["FREE", "STARTER", "PRO", "ENTERPRISE"] as const;
type Plan = typeof PLANS[number];

interface Props {
  tenantId: string;
  currentPlan: Plan;
  isActive: boolean;
}

export default function TenantActionButtons({ tenantId, currentPlan, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(currentPlan);
  const [credits, setCredits] = useState(200);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  async function patch(body: object, key: string) {
    setLoading(key);
    await fetch(`/api/super-admin/tenants/${tenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(null);
    router.refresh();
  }



  return (
    <div className="flex flex-wrap gap-2">
      {/* Plan selector */}
      <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-xl px-2 py-1.5">
        <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value as Plan)}
          className="bg-transparent text-xs font-semibold text-foreground focus:outline-none">
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => patch({ plan: selectedPlan }, "plan")}
          disabled={selectedPlan === currentPlan || !!loading}
          className="p-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-foreground disabled:opacity-40 transition-colors">
          {loading === "plan" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </button>
      </div>

      {/* Toggle active */}
      <button onClick={() => patch({ isActive: !isActive }, "active")} disabled={!!loading}
        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
          isActive
            ? "bg-rose-500/15 text-rose-400 border-rose-500/20 hover:bg-rose-500/25"
            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25")}>
        {loading === "active" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : isActive ? <PowerOff className="w-3.5 h-3.5" /> : <PowerIcon className="w-3.5 h-3.5" />}
        {isActive ? "Deactivate" : "Activate"}
      </button>

      {/* Grant AI credits */}
      <button onClick={() => setShowCreditModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-colors">
        <Zap className="w-3.5 h-3.5" /> Grant Credits
      </button>

      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Grant AI Credits
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Month</label>
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Credit Limit</label>
                <input type="number" min={1} value={credits} onChange={(e) => setCredits(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { patch({ grantCredits: credits, month }, "credits"); setShowCreditModal(false); }}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-colors">
                Confirm
              </button>
              <button onClick={() => setShowCreditModal(false)}
                className="flex-1 py-2 bg-muted/50 hover:bg-white/10 text-foreground text-sm rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
