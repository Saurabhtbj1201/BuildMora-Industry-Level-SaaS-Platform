"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert, ShieldX, Zap, Loader2, Check, AlertCircle,
  Crown, CheckCircle2,
} from "lucide-react";


interface SuperAdmin {
  id: string; name: string | null; email: string | null;
  image: string | null; isActive: boolean; createdAt: string;
}
interface Tenant { id: string; siteName: string; siteSlug: string; plan: string }

interface Props {
  superAdmins: SuperAdmin[];
  tenants: Tenant[];
}

export default function AdminSettingsClient({ superAdmins: initialAdmins, tenants }: Props) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [loading, setLoading] = useState<string | null>(null);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteError, setPromoteError] = useState("");
  const [promoteSuccess, setPromoteSuccess] = useState("");

  // Credit grant
  const [selectedTenant, setSelectedTenant] = useState(tenants[0]?.id ?? "");
  const [creditAmount, setCreditAmount] = useState(200);
  const [creditMonth, setCreditMonth] = useState(new Date().toISOString().slice(0, 7));
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditMsg, setCreditMsg] = useState("");

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault();
    setPromoteError(""); setPromoteSuccess("");
    setLoading("promote");

    // Find user by email first
    const searchRes = await fetch(`/api/super-admin/users?search=${encodeURIComponent(promoteEmail)}&active=true`);
    const data = await searchRes.json();
    const user = data.users?.[0];
    if (!user || user.email !== promoteEmail) {
      setPromoteError("No active account found with that email."); setLoading(null); return;
    }

    await fetch(`/api/super-admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "promote" }),
    });
    setLoading(null);
    setPromoteSuccess(`${promoteEmail} is now a Super Admin.`);
    setPromoteEmail("");
    router.refresh();
  }

  async function handleDemote(userId: string) {
    if (!confirm("Remove super admin access from this user?")) return;
    setLoading(userId);
    await fetch(`/api/super-admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "demote" }),
    });
    setLoading(null);
    setAdmins((prev) => prev.filter((a) => a.id !== userId));
  }

  async function handleGrantCredits(e: React.FormEvent) {
    e.preventDefault();
    setCreditLoading(true); setCreditMsg("");
    await fetch(`/api/super-admin/tenants/${selectedTenant}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantCredits: creditAmount, month: creditMonth }),
    });
    setCreditLoading(false);
    setCreditMsg(`Granted ${creditAmount} credits to tenant for ${creditMonth}`);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Super Admin Management */}
      <section className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-bold text-white font-display">Super Admin Management</h2>
        </div>

        {/* Current admins */}
        <div className="space-y-2">
          {admins.map((admin) => (
            <div key={admin.id}
              className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                {admin.image
                  ? <img src={admin.image} alt="" className="w-full h-full object-cover" />
                  : (admin.name?.[0] ?? admin.email?.[0] ?? "A").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{admin.name ?? "—"}</p>
                <p className="text-xs text-slate-500 truncate">{admin.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20">
                  <ShieldAlert className="w-2.5 h-2.5" /> SUPER ADMIN
                </span>
                <button
                  onClick={() => handleDemote(admin.id)}
                  disabled={!!loading}
                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-40"
                  title="Remove admin access"
                >
                  {loading === admin.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <ShieldX className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Promote by email */}
        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-xs text-slate-500 mb-3">Promote an existing user to Super Admin by email:</p>
          <form onSubmit={handlePromote} className="flex gap-2">
            <input
              type="email" required value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button type="submit" disabled={!!loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
              {loading === "promote" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              Promote
            </button>
          </form>
          {promoteError && (
            <div className="mt-2 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {promoteError}
            </div>
          )}
          {promoteSuccess && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {promoteSuccess}
            </div>
          )}
        </div>
      </section>

      {/* AI Credit Grant */}
      <section className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white font-display">Grant AI Credits</h2>
        </div>
        <p className="text-xs text-slate-500">
          Set the AI credit limit for any tenant for a specific month. This upserts the{" "}
          <code className="font-mono text-slate-400">AiCreditLedger</code> record.
        </p>
        <form onSubmit={handleGrantCredits} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="text-xs text-slate-500 block mb-1.5">Tenant</label>
              <select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500">
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.siteName} ({t.siteSlug})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Month</label>
              <input type="month" value={creditMonth} onChange={(e) => setCreditMonth(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Credit Limit</label>
              <input type="number" min={1} value={creditAmount} onChange={(e) => setCreditAmount(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={creditLoading || tenants.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold rounded-xl transition-colors">
              {creditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Grant Credits
            </button>
            {creditMsg && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Check className="w-3.5 h-3.5" /> {creditMsg}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
