"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  ScrollText,
  LifeBuoy,
  Settings,
  LogOut,
  ShieldAlert,
  ArrowLeftRight,
  ChevronDown,
} from "lucide-react";

const NAV = [
  { label: "Overview",   href: "/super-admin",            icon: LayoutDashboard },
  { label: "Users",      href: "/super-admin/users",      icon: Users           },
  { label: "Tenants",    href: "/super-admin/tenants",    icon: Building2       },
  { label: "Audit Logs", href: "/super-admin/audit-logs", icon: ScrollText      },
  { label: "Support",    href: "/super-admin/support",    icon: LifeBuoy        },
  { label: "Settings",   href: "/super-admin/settings",   icon: Settings        },
];

interface SuperAdminSidebarProps {
  adminName: string;
  adminEmail?: string;
  adminImage?: string | null;
}

export function SuperAdminSidebar({ adminName, adminEmail, adminImage }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/super-admin" ? pathname === href : pathname.startsWith(href);

  const initials = adminName
    ? adminName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r border-border shrink-0">

      {/* ── Logo / Brand ───────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm font-display shrink-0 shadow-md shadow-violet-500/20">
          B
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate font-display">BuildMora</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShieldAlert className="w-2.5 h-2.5 text-violet-500 shrink-0" />
            <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-widest">Super Admin</p>
          </div>
        </div>
      </div>

      {/* ── Switch to Dashboard ────────────────────────────── */}
      <div className="mx-3 mt-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
            bg-muted/60 border border-border text-muted-foreground
            hover:bg-muted hover:text-foreground hover:border-border
            transition-all duration-150 group text-xs font-semibold"
        >
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
            <LayoutDashboard className="w-3 h-3 group-hover:text-primary transition-colors" />
          </div>
          <span className="flex-1 text-left">Tenant Dashboard</span>
          <ArrowLeftRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* ── Section label ──────────────────────────────────── */}
      <p className="px-5 pt-5 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        Administration
      </p>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-3">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "sidebar-link",
                active && "active"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {active && (
                <ChevronDown className="ml-auto w-3.5 h-3.5 -rotate-90 text-primary opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        {/* User identity */}
        <div className="flex items-center gap-2.5 px-2 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden ring-2 ring-violet-500/20">
            {adminImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={adminImage} alt={adminName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{adminName}</p>
            {adminEmail && (
              <p className="text-[10px] text-muted-foreground truncate">{adminEmail}</p>
            )}
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <ShieldAlert className="w-2.5 h-2.5 text-violet-400" />
              <span className="text-[9px] text-violet-400 font-bold tracking-wide">SA</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
