

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color?: "brand" | "success" | "warning" | "danger" | "neutral";
  loading?: boolean;
}

const colorMap = {
  brand:   { bg: "bg-primary/10",     icon: "text-primary",     ring: "ring-primary/20" },
  success: { bg: "bg-success/10",     icon: "text-success",     ring: "ring-success/20" },
  warning: { bg: "bg-warning/10",     icon: "text-warning",     ring: "ring-warning/20" },
  danger:  { bg: "bg-destructive/10", icon: "text-destructive", ring: "ring-destructive/20" },
  neutral: { bg: "bg-muted",          icon: "text-muted-foreground", ring: "ring-border" },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "brand",
  loading = false,
}: StatCardProps) {
  const colors = colorMap[color];
  const isPositive = (trend?.value ?? 0) >= 0;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg skeleton" />
          <div className="w-16 h-4 skeleton rounded" />
        </div>
        <div className="w-20 h-7 skeleton rounded mb-1" />
        <div className="w-28 h-3 skeleton rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 card-lift group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center ring-1", colors.bg, colors.ring)}>
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>

        {/* Trend badge */}
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              isPositive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-foreground font-display tabular-nums">
        {value}
      </p>

      {/* Labels */}
      <p className="text-sm font-medium text-foreground/80 mt-0.5">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
      {trend && (
        <p className="text-xs text-muted-foreground mt-1">
          {trend.label}
        </p>
      )}
    </div>
  );
}
