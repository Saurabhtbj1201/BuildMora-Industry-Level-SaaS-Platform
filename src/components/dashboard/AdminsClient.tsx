"use client";

import { useState } from "react";
import { ShieldCheck, UserPlus, Trash2, Crown, Shield, Eye, Users, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getInitials } from "@/lib/utils";

type TenantRole = "OWNER" | "ADMIN" | "COLLABORATOR" | "VIEWER";

interface Member {
  id: string;
  role: TenantRole;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

interface Props {
  tenantId: string;
  initialMembers: Member[];
  ownerEmail: string;
}

const ROLE_CONFIG: Record<TenantRole, { label: string; icon: React.ElementType; color: string; description: string }> = {
  OWNER:       { label: "Owner",       icon: Crown,      color: "text-warning",     description: "Full control — cannot be changed" },
  ADMIN:       { label: "Admin",       icon: Shield,     color: "text-primary",     description: "Can manage all content and settings" },
  COLLABORATOR:{ label: "Collaborator",icon: Users,      color: "text-accent",      description: "Can create and edit content" },
  VIEWER:      { label: "Viewer",      icon: Eye,        color: "text-muted-foreground", description: "Read-only access to dashboard" },
};

export default function AdminsClient({ tenantId, initialMembers }: Omit<Props, 'ownerEmail'> & { ownerEmail: string }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TenantRole>("COLLABORATOR");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setInviting(true);
    const res = await fetch("/api/admins/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) { setInviteError(data.error ?? "Failed to invite"); return; }
    setInviteSuccess(`${inviteEmail} has been added as ${inviteRole}.`);
    setInviteEmail("");
    // Refresh list
    const listRes = await fetch(`/api/admins?tenantId=${tenantId}`);
    if (listRes.ok) setMembers(await listRes.json());
  }

  async function handleRoleChange(memberId: string, newRole: TenantRole) {
    setLoadingId(memberId);
    const res = await fetch("/api/admins/role", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role: newRole }),
    });
    setLoadingId(null);
    if (res.ok) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this member's access?")) return;
    setLoadingId(memberId);
    const res = await fetch(`/api/admins/${memberId}`, { method: "DELETE" });
    setLoadingId(null);
    if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  return (
    <div className="space-y-8">
      {/* Invite Form */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <h2 className="font-bold font-display text-foreground">Invite Member</h2>
        </div>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email" required placeholder="Email address" value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as TenantRole)}
            className="px-3 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {(["ADMIN", "COLLABORATOR", "VIEWER"] as TenantRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
            ))}
          </select>
          <Button type="submit" disabled={inviting} className="gap-2 shrink-0">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Invite
          </Button>
        </form>

        {inviteError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />{inviteError}
          </div>
        )}
        {inviteSuccess && (
          <div className="text-sm text-success bg-success/10 border border-success/20 rounded-lg p-3">{inviteSuccess}</div>
        )}

        {/* Role legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          {(["ADMIN", "COLLABORATOR", "VIEWER"] as TenantRole[]).map((r) => {
            const { icon: Icon, label, description, color } = ROLE_CONFIG[r];
            return (
              <div key={r} className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", color)} />
                <div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="font-bold font-display text-foreground">Team Members</h2>
          <span className="ml-auto text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</span>
        </div>

        {members.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No additional members yet. Invite someone above.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((m) => {
              const { icon: RoleIcon, label: roleLabel, color } = ROLE_CONFIG[m.role];
              const isOwner = m.role === "OWNER";
              const isLoading = loadingId === m.id;
              return (
                <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                    {m.user.image
                      ? <img src={m.user.image} alt="" className="w-full h-full object-cover" />
                      : getInitials(m.user.name ?? m.user.email ?? "?")}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{m.user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-2">
                    <RoleIcon className={cn("w-3.5 h-3.5", color)} />
                    {isOwner ? (
                      <span className="text-xs font-semibold text-muted-foreground">{roleLabel}</span>
                    ) : (
                      <select
                        value={m.role}
                        disabled={isLoading}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as TenantRole)}
                        className="text-xs bg-transparent border-none focus:outline-none text-foreground font-medium cursor-pointer"
                      >
                        {(["ADMIN", "COLLABORATOR", "VIEWER"] as TenantRole[]).map((r) => (
                          <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Actions */}
                  {!isOwner && (
                    <div className="flex items-center gap-1">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
