"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Palette,
  CreditCard,
  FolderGit2,
  Code2,
  Users,
  BookOpen,
  Star,
  Briefcase,
  MessageSquare,
  Mail,
  ShieldCheck,
  Settings,
  ChevronDown,
  Zap,
  LogOut,
  ExternalLink,
  ShieldAlert,
  ArrowLeftRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Personalization", href: "/dashboard/personalization", icon: Palette },
  { label: "Expense Tracker", href: "/dashboard/expenses", icon: CreditCard },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderGit2,
    children: [
      { label: "All Projects", href: "/dashboard/projects" },
      { label: "Add Project", href: "/dashboard/projects/new" },
    ],
  },
  {
    label: "Open Source",
    href: "/dashboard/open-source",
    icon: Code2,
    children: [
      { label: "All Projects", href: "/dashboard/open-source" },
      { label: "Add Project", href: "/dashboard/open-source/new" },
    ],
  },
  { label: "Contributors", href: "/dashboard/contributors", icon: Users },
  {
    label: "Blog",
    href: "/dashboard/blog",
    icon: BookOpen,
    children: [
      { label: "All Posts", href: "/dashboard/blog" },
      { label: "New Post", href: "/dashboard/blog/new" },
    ],
  },
  { label: "Reviews", href: "/dashboard/reviews", icon: Star },
  { label: "Services", href: "/dashboard/services", icon: Briefcase },
  { label: "Enquiries", href: "/dashboard/enquiries", icon: MessageSquare },
  { label: "Contacts", href: "/dashboard/contacts", icon: Mail },
  { label: "Admins", href: "/dashboard/admins", icon: ShieldCheck },
  { label: "Site Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  tenantSlug: string;
  siteName: string;
  aiCredits?: { used: number; limit: number };
  isSuperAdmin?: boolean;
}

export function DashboardSidebar({
  tenantSlug,
  siteName,
  aiCredits,
  isSuperAdmin = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const toggleExpand = (label: string) =>
    setExpanded((prev) => (prev === label ? null : label));

  const creditsPercent =
    aiCredits && aiCredits.limit > 0
      ? Math.round((aiCredits.used / aiCredits.limit) * 100)
      : 0;

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r border-border shrink-0">
      {/* Logo / Site Name */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-sm font-display shrink-0">
          B
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate font-display">
            {siteName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {tenantSlug}.buildmora.com
          </p>
        </div>
      </div>

      {/* Super Admin Mode Banner — only visible for super admins */}
      {isSuperAdmin && (
        <div className="mx-3 mt-3">
          <button
            onClick={() => router.push("/super-admin")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
              bg-violet-600/10 border border-violet-500/20 text-violet-400
              hover:bg-violet-600/20 hover:border-violet-500/40 hover:text-violet-300
              transition-all duration-150 group text-xs font-semibold"
          >
            <div className="w-5 h-5 rounded-md bg-violet-600/20 flex items-center justify-center shrink-0 group-hover:bg-violet-600/30 transition-colors">
              <ShieldAlert className="w-3 h-3" />
            </div>
            <span className="flex-1 text-left">Super Admin Panel</span>
            <ArrowLeftRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasChildren = !!item.children?.length;
          const isExpanded = expanded === item.label || active;

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    "sidebar-link w-full justify-between",
                    active && "active"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5 animate-fade-in">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "sidebar-link text-xs py-1.5",
                          pathname === child.href && "active"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", active && "active")}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
              {item.badge !== undefined && (
                <span className="ml-auto badge badge-brand text-[10px]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Credits meter */}
      {aiCredits && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Zap className="w-3 h-3 text-primary" />
              AI Credits
            </span>
            <span className="text-xs text-muted-foreground">
              {aiCredits.limit === -1
                ? "∞"
                : `${aiCredits.used}/${aiCredits.limit}`}
            </span>
          </div>
          {aiCredits.limit !== -1 && (
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  creditsPercent >= 90
                    ? "bg-destructive"
                    : creditsPercent >= 70
                    ? "bg-warning"
                    : "bg-primary"
                )}
                style={{ width: `${Math.min(creditsPercent, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        <Link
          href={`https://${tenantSlug}.buildmora.com`}
          target="_blank"
          className="sidebar-link text-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Public Site
        </Link>
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
