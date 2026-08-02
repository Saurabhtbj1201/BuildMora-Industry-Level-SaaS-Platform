"use client";

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ─── Shared tooltip style ─────────────────────────────────────────────────────
const TooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

// ─── Views Over Time (Area Chart) ─────────────────────────────────────────────
interface ViewsData {
  date: string;
  views: number;
  unique?: number;
}

export function ViewsChart({ data }: { data: ViewsData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="hsl(222,89%,58%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(222,89%,58%)" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="gradUnique" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="hsl(260,60%,56%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(260,60%,56%)" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={TooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
        <Area
          type="monotone"
          dataKey="views"
          name="Views"
          stroke="hsl(222,89%,58%)"
          strokeWidth={2}
          fill="url(#gradViews)"
        />
        {data[0]?.unique !== undefined && (
          <Area
            type="monotone"
            dataKey="unique"
            name="Unique"
            stroke="hsl(260,60%,56%)"
            strokeWidth={2}
            fill="url(#gradUnique)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Content Activity (Bar Chart) ─────────────────────────────────────────────
interface ActivityData {
  month: string;
  projects: number;
  blogs: number;
  enquiries: number;
}

export function ActivityChart({ data }: { data: ActivityData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={TooltipStyle} cursor={{ fill: "hsl(var(--muted)/0.5)" }} />
        <Bar dataKey="projects" name="Projects" fill="hsl(222,89%,58%)" radius={[3, 3, 0, 0]} maxBarSize={24} />
        <Bar dataKey="blogs"    name="Blogs"    fill="hsl(260,60%,56%)" radius={[3, 3, 0, 0]} maxBarSize={24} />
        <Bar dataKey="enquiries" name="Enquiries" fill="hsl(142,76%,36%)" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Enquiry Sources (Pie Chart) ──────────────────────────────────────────────
interface PieData {
  name: string;
  value: number;
}

const PIE_COLORS = [
  "hsl(222,89%,58%)",
  "hsl(260,60%,56%)",
  "hsl(142,76%,36%)",
  "hsl(38,92%,50%)",
  "hsl(0,84%,60%)",
];

export function EnquiryPieChart({ data }: { data: PieData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PIE_COLORS[index % PIE_COLORS.length]}
              strokeWidth={0}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={TooltipStyle} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "11px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
