"use client";

import { formatDate } from "@/lib/utils";
import {
  Activity, FolderGit2, BookOpen, MessageSquare, Star,
  User, Shield, Globe, Clock,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  createdAt: Date | string;
  metadata?: any;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const iconMap: Record<string, any> = {
  PAGE_VIEW: Globe,
  PROJECT_VIEW: FolderGit2,
  BLOG_VIEW: BookOpen,
  ENQUIRY_CREATED: MessageSquare,
  REVIEW_SUBMITTED: Star,
  PROFILE_UPDATED: User,
  SECURITY_EVENT: Shield,
};

const labelMap: Record<string, string> = {
  PAGE_VIEW: "Page view recorded",
  PROJECT_VIEW: "Project viewed by visitor",
  BLOG_VIEW: "Blog post read",
  ENQUIRY_CREATED: "New enquiry received",
  REVIEW_SUBMITTED: "New review submitted",
  PROFILE_UPDATED: "Profile updated",
  SECURITY_EVENT: "Security event logged",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold font-display text-foreground">
            Recent Activity
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">Real-time log</span>
      </div>

      <div className="space-y-3">
        {activities.map((item) => {
          const Icon = iconMap[item.type] || Clock;
          const label = labelMap[item.type] || item.type;

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 text-xs p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{label}</p>
                {item.metadata?.path && (
                  <p className="text-muted-foreground truncate text-[11px] font-mono mt-0.5">
                    {item.metadata.path}
                  </p>
                )}
              </div>

              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatDate(item.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
