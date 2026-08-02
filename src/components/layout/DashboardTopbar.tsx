"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Moon, Sun, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

interface DashboardTopbarProps {
  onMobileMenuToggle?: () => void;
}

// Generate breadcrumb segments from pathname
function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: seg
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return crumbs;
}

export function DashboardTopbar({ onMobileMenuToggle }: DashboardTopbarProps) {
  const { data: session } = useSession();
  const breadcrumbs = useBreadcrumbs();
  const [isDark, setIsDark] = useState(false);

  const toggleDark = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const user = session?.user;

  return (
    <header className="h-14 bg-card border-b border-border flex items-center gap-4 px-4 sm:px-6 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex-1 hidden sm:flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-muted-foreground/50 text-xs">/</span>
            )}
            <span
              className={cn(
                "capitalize",
                crumb.isLast
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2 ml-auto">
        {/* Search */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/60 border border-border rounded-lg hover:bg-muted transition-colors w-48">
          <Search className="w-3.5 h-3.5" />
          <span>Search…</span>
          <kbd className="ml-auto text-[10px] bg-background border border-border rounded px-1 py-0.5 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="w-4 h-4" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-semibold shrink-0 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user?.name ?? user?.email ?? "U")
            )}
          </div>
          <div className="hidden md:block min-w-0">
            <p className="text-xs font-medium text-foreground truncate max-w-28">
              {user?.name ?? "User"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate max-w-28">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
