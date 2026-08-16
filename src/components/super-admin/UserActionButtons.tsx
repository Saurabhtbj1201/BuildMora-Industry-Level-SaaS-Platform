"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff, ShieldCheck, Zap, ShieldAlert, ShieldX, Loader2 } from "lucide-react";

interface Props {
  userId: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  isSelf: boolean;
  tenantId?: string;
}

export default function UserActionButtons({ userId, isActive, isSuperAdmin, isSelf, tenantId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [credits, setCredits] = useState(100);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  async function doAction(action: string, extra?: object) {
    setLoading(action);
    await fetch(`/api/super-admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Enable/Disable */}
      {!isSelf && (
        <button
          onClick={() => doAction(isActive ? "disable" : "enable")}
          disabled={!!loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isActive
              ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20"
              : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20"
          }`}
        >
          {loading === (isActive ? "disable" : "enable")
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {isActive ? "Disable" : "Enable"}
        </button>
      )}

      {/* Promote/Demote super admin */}
      {!isSelf && (
        <button
          onClick={() => doAction(isSuperAdmin ? "demote" : "promote")}
          disabled={!!loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
            isSuperAdmin
              ? "bg-slate-700/40 text-muted-foreground hover:bg-slate-700/60 border-slate-600/40"
              : "bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 border-violet-500/20"
          }`}
        >
          {loading === (isSuperAdmin ? "demote" : "promote")
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : isSuperAdmin ? <ShieldX className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          {isSuperAdmin ? "Remove Admin" : "Make Admin"}
        </button>
      )}

      {/* Grant credits */}
      {tenantId && (
        <button
          onClick={() => setShowCreditModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/20 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" /> Grant AI Credits
        </button>
      )}

      {/* Credit modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Grant AI Credits
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Month (YYYY-MM)</label>
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
              <button
                onClick={() => { doAction("grantCredits", { credits, month }); setShowCreditModal(false); }}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-colors"
              >
                Grant Credits
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
