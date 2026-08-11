import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatNumber, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import { ViewsChart, ActivityChart, EnquiryPieChart } from "@/components/dashboard/AnalyticsCharts";
import {
  FolderGit2, BookOpen, MessageSquare, Eye,
  Code2, Briefcase, Star, Users,
} from "lucide-react";
import { subDays, startOfMonth, format } from "date-fns";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Overview",
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function getDashboardData(tenantId: string) {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const monthStart = startOfMonth(now);

  const [
    projectCount,
    publishedProjects,
    blogCount,
    publishedBlogs,
    osCount,
    serviceCount,
    reviewCount,
    pendingReviews,
    enquiryCount,
    newEnquiries,
    contactCount,
    // Analytics: total views this month
    viewsThisMonth,
    viewsLastMonth,
    // Recent activity events
    recentEvents,
    // Monthly analytics for chart (last 6 months)
    monthlyViews,
    // Enquiry sources breakdown
    enquirySources,
    // Recent enquiries
    recentEnquiries,
  ] = await Promise.all([
    prisma.project.count({ where: { tenantId } }),
    prisma.project.count({ where: { tenantId, isPublished: true } }),
    prisma.blogPost.count({ where: { tenantId } }),
    prisma.blogPost.count({ where: { tenantId, status: "PUBLISHED" } }),
    prisma.openSourceProject.count({ where: { tenantId } }),
    prisma.service.count({ where: { tenantId } }),
    prisma.review.count({ where: { tenantId } }),
    prisma.review.count({ where: { tenantId, status: "PENDING" } }),
    prisma.enquiry.count({ where: { tenantId } }),
    prisma.enquiry.count({ where: { tenantId, status: "NEW" } }),
    prisma.contact.count({ where: { tenantId } }),

    // Views this month
    prisma.analyticsEvent.count({
      where: { tenantId, type: "PAGE_VIEW", createdAt: { gte: monthStart } },
    }),
    // Views last month (for trend)
    prisma.analyticsEvent.count({
      where: {
        tenantId,
        type: "PAGE_VIEW",
        createdAt: { gte: subDays(monthStart, 30), lt: monthStart },
      },
    }),

    // Recent events for activity feed
    prisma.analyticsEvent.findMany({
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Last 30 days daily page views for chart
    prisma.analyticsEvent.groupBy({
      by: ["createdAt"],
      where: { tenantId, type: "PAGE_VIEW", createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),

    // Enquiry sources breakdown
    prisma.enquiry.groupBy({
      by: ["source"],
      where: { tenantId },
      _count: true,
    }),

    // Recent enquiries
    prisma.enquiry.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, source: true, status: true, createdAt: true },
    }),
  ]);

  // Calculate view trend %
  const viewTrend =
    viewsLastMonth > 0
      ? Math.round(((viewsThisMonth - viewsLastMonth) / viewsLastMonth) * 100)
      : 0;

  // Build chart data for views (last 7 days, grouped by day)
  const viewsByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(now, i), "MMM d");
    viewsByDay[d] = 0;
  }
  for (const event of monthlyViews) {
    const d = format(new Date(event.createdAt), "MMM d");
    if (d in viewsByDay) viewsByDay[d] = (viewsByDay[d] ?? 0) + event._count;
  }
  const viewsChartData = Object.entries(viewsByDay).map(([date, views]) => ({
    date,
    views,
  }));

  // Activity bar chart — last 6 months content activity
  const activityData = Array.from({ length: 6 }, (_, i) => {
    const d = subDays(now, (5 - i) * 30);
    return { month: format(d, "MMM"), projects: 0, blogs: 0, enquiries: 0 };
  });

  // Enquiry sources for pie chart
  const sourcePieData = enquirySources.map((s) => ({
    name: s.source.charAt(0) + s.source.slice(1).toLowerCase(),
    value: s._count,
  }));

  return {
    stats: {
      projects: projectCount,
      publishedProjects,
      blogs: blogCount,
      publishedBlogs,
      osProjects: osCount,
      services: serviceCount,
      reviews: reviewCount,
      pendingReviews,
      enquiries: enquiryCount,
      newEnquiries,
      contacts: contactCount,
      views: viewsThisMonth,
      viewTrend,
    },
    charts: { viewsChartData, activityData, sourcePieData },
    recentEnquiries,
    recentEvents,
  };
}

export default async function DashboardOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, siteName: true, plan: true, createdAt: true },
  });

  if (!tenant) redirect("/onboarding");

  const data = await getDashboardData(tenant.id);
  const { stats, charts, recentEnquiries } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back! Here&apos;s how your site is performing.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Views"
          value={formatNumber(stats.views)}
          subtitle="This month"
          icon={Eye}
          color="brand"
          trend={{ value: stats.viewTrend, label: "vs last month" }}
        />
        <StatCard
          title="Projects"
          value={stats.projects}
          subtitle={`${stats.publishedProjects} published`}
          icon={FolderGit2}
          color="success"
        />
        <StatCard
          title="Blog Posts"
          value={stats.blogs}
          subtitle={`${stats.publishedBlogs} published`}
          icon={BookOpen}
          color="warning"
        />
        <StatCard
          title="Enquiries"
          value={stats.enquiries}
          subtitle={`${stats.newEnquiries} new`}
          icon={MessageSquare}
          color={stats.newEnquiries > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Open Source"
          value={stats.osProjects}
          icon={Code2}
          color="brand"
        />
        <StatCard
          title="Services"
          value={stats.services}
          icon={Briefcase}
          color="neutral"
        />
        <StatCard
          title="Reviews"
          value={stats.reviews}
          subtitle={stats.pendingReviews > 0 ? `${stats.pendingReviews} pending` : undefined}
          icon={Star}
          color="warning"
        />
        <StatCard
          title="Contacts"
          value={stats.contacts}
          icon={Users}
          color="neutral"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Views chart — takes 2/3 width */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Page Views
              </h2>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <ViewsChart data={charts.viewsChartData} />
        </div>

        {/* Enquiry sources pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Enquiry Sources
            </h2>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>
          {charts.sourcePieData.length > 0 ? (
            <EnquiryPieChart data={charts.sourcePieData} />
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
              No enquiries yet
            </div>
          )}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Content Activity
            </h2>
            <p className="text-xs text-muted-foreground">
              Projects, blogs & enquiries over time
            </p>
          </div>
        </div>
        <ActivityChart data={charts.activityData} />
      </div>

      {/* Recent Enquiries table */}
      {recentEnquiries.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Recent Enquiries
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    Source
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentEnquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-foreground">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.email}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="badge badge-brand">
                        {e.source.charAt(0) + e.source.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`badge ${
                          e.status === "NEW"
                            ? "badge-danger"
                            : e.status === "REPLIED"
                            ? "badge-success"
                            : "badge-neutral"
                        }`}
                      >
                        {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      {formatDate(e.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
