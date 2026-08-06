"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, ScrollText,
  LifeBuoy, Settings, LogOut, ShieldAlert, Zap,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { label: "Overview",    href: "/super-admin",             icon: LayoutDashboard },
  { label: "Users",       href: "/super-admin/users",       icon: Users           },
  { label: "Tenants",     href: "/super-admin/tenants",     icon: Building2       },
  { label: "Audit Logs",  href: "/super-admin/audit-logs",  icon: ScrollText      },
  { label: "Support",     href: "/super-admin/support",     icon: LifeBuoy        },
  { label: "Settings",    href: "/super-admin/settings",    icon: Settings        },
];

export function SuperAdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/super-admin" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#0f1117] border-r border-white/[0.06] shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <ShieldAlert className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white font-display tracking-tight">BuildMora</p>
            <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-widest">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300")} />
                {label}
              </span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-violet-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-white/[0.06] space-y-1">
        {/* Admin identity */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {adminName?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{adminName}</p>
            <div className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-violet-400" />
              <p className="text-[10px] text-violet-400 font-medium">Super Admin</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
