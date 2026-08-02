"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard, Plus, Trash2, Download, Loader2,
  TrendingDown, Target, Calendar,
  Tag, RefreshCw, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Expense {
  id: string;
  title: string;
  amount: string | number;
  currency: string;
  category: string;
  date: string;
  description: string | null;
  isRecurring: boolean;
  recurringPeriod: string | null;
  tags: string[];
}

interface Budget {
  monthlyBudget: number;
  currency: string;
  categoryBudgets: Record<string, number> | null;
}

const EXPENSE_CATEGORIES = [
  "Food & Dining", "Transport", "Housing", "Utilities", "Healthcare",
  "Education", "Entertainment", "Shopping", "Subscriptions", "Travel",
  "Business", "Investments", "Savings", "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#6366f1", Transport: "#8b5cf6", Housing: "#a78bfa",
  Utilities: "#c4b5fd", Healthcare: "#22d3ee", Education: "#0ea5e9",
  Entertainment: "#f59e0b", Shopping: "#f97316", Subscriptions: "#ef4444",
  Travel: "#84cc16", Business: "#10b981", Investments: "#14b8a6",
  Savings: "#06b6d4", Other: "#64748b",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatAmount(amount: string | number, currency = "INR") {
  const n = Number(amount);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function getMonthKey(date: string) {
  const d = new Date(date);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (expense: Expense) => void;
}) {
  const [form, setForm] = useState({
    title: "", amount: "", currency: "INR", category: "Other",
    date: new Date().toISOString().slice(0, 10),
    description: "", isRecurring: false, recurringPeriod: "MONTHLY", tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
        recurringPeriod: form.isRecurring ? form.recurringPeriod : null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
    onAdded(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold font-display text-foreground">Add Expense</h2>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Title *</label>
              <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Grocery run" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Amount *</label>
              <input required type="number" min="0.01" step="0.01" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none">
                {["INR","USD","EUR","GBP"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Category *</label>
              <select required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none">
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date *</label>
              <input required type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional note…" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tags (comma-separated)</label>
              <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="work, personal, urgent" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <input type="checkbox" id="recurring" checked={form.isRecurring}
                onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))} className="rounded" />
              <label htmlFor="recurring" className="text-sm text-foreground cursor-pointer">Recurring expense</label>
              {form.isRecurring && (
                <select value={form.recurringPeriod} onChange={(e) => setForm((f) => ({ ...f, recurringPeriod: e.target.value }))}
                  className="ml-auto h-8 px-2 bg-background border border-border rounded-lg text-xs focus:outline-none">
                  {["DAILY","WEEKLY","MONTHLY","YEARLY"].map((p) => <option key={p}>{p}</option>)}
                </select>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}Add Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Current month range
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const load = useCallback(async () => {
    setLoading(true);
    const [expRes, budRes] = await Promise.all([
      fetch("/api/expenses"),
      fetch("/api/expenses/budget"),
    ]);
    const [expData, budData] = await Promise.all([expRes.json(), budRes.json()]);
    setExpenses(expData.expenses ?? []);
    setBudget(budData.budget ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeleting(id);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  }

  // ─── Derived data ───────────────────────────────────────────────────────
  const thisMonth = expenses.filter((e) => {
    const d = new Date(e.date);
    return d >= new Date(monthStart) && d <= new Date(monthEnd);
  });

  const totalThisMonth = thisMonth.reduce((a, e) => a + Number(e.amount), 0);
  const totalAll = expenses.reduce((a, e) => a + Number(e.amount), 0);
  const budgetPercent = budget ? Math.min((totalThisMonth / budget.monthlyBudget) * 100, 100) : 0;
  const recurring = expenses.filter((e) => e.isRecurring).length;

  // Category breakdown for pie
  const categoryTotals = thisMonth.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});
  const pieData = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // Monthly trend for area chart (last 6 months)
  const trendMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendMap[`${MONTHS[d.getMonth()]} ${d.getFullYear()}`] = 0;
  }
  expenses.forEach((e) => {
    const key = getMonthKey(e.date);
    if (key in trendMap) trendMap[key] = (trendMap[key] ?? 0) + Number(e.amount);
  });
  const trendData = Object.entries(trendMap).map(([month, amount]) => ({ month, amount }));

  // Filtered list
  const filtered = categoryFilter
    ? expenses.filter((e) => e.category === categoryFilter)
    : expenses;

  // CSV export
  function exportCSV() {
    const rows = [
      ["Date", "Title", "Category", "Amount", "Currency", "Recurring", "Description"],
      ...expenses.map((e) => [
        new Date(e.date).toLocaleDateString("en-IN"),
        e.title, e.category, Number(e.amount).toFixed(2), e.currency,
        e.isRecurring ? "Yes" : "No", e.description ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "expenses.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {showAdd && (
        <AddExpenseModal
          onClose={() => setShowAdd(false)}
          onAdded={(e) => { setExpenses((prev) => [e, ...prev]); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Expense Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track spending, set budgets, and understand your financial patterns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Expense
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "This Month",
            value: formatAmount(totalThisMonth),
            sub: budget ? `of ${formatAmount(budget.monthlyBudget)} budget` : "No budget set",
            icon: TrendingDown,
            color: budgetPercent >= 90 ? "text-destructive bg-destructive/10" : "text-primary bg-primary/10",
          },
          {
            label: "Total Spent",
            value: formatAmount(totalAll),
            sub: `${expenses.length} transactions`,
            icon: CreditCard,
            color: "text-accent bg-accent/10",
          },
          {
            label: "Budget Used",
            value: budget ? `${Math.round(budgetPercent)}%` : "—",
            sub: budget ? `${formatAmount(Math.max(0, budget.monthlyBudget - totalThisMonth))} remaining` : "Configure budget",
            icon: Target,
            color: budgetPercent >= 90 ? "text-destructive bg-destructive/10" : "text-success bg-success/10",
          },
          {
            label: "Recurring",
            value: recurring,
            sub: "active bills",
            icon: Calendar,
            color: "text-warning bg-warning/10",
          },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold font-display text-foreground truncate">{s.value}</p>
              <p className="text-xs text-muted-foreground leading-snug">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Budget progress bar */}
      {budget && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Monthly Budget</span>
            <span className={`font-semibold ${budgetPercent >= 90 ? "text-destructive" : "text-foreground"}`}>
              {formatAmount(totalThisMonth)} / {formatAmount(budget.monthlyBudget)}
            </span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${budgetPercent >= 90 ? "bg-destructive" : budgetPercent >= 70 ? "bg-warning" : "bg-primary"}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          {budgetPercent >= 90 && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              You've used {Math.round(budgetPercent)}% of your monthly budget.
            </p>
          )}
        </div>
      )}

      {/* Charts row */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly trend */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-primary" /> Monthly Spending Trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: ValueType, name: NameType) => [typeof value === "number" ? formatAmount(value) : String(value ?? ""), String(name)]) as any}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" /> This Month by Category
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={((value: ValueType, name: NameType) => [typeof value === "number" ? formatAmount(value) : String(value ?? ""), String(name)]) as any}
                  />
                  <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                No expenses this month yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center bg-muted/20">
          <span className="text-sm font-semibold text-foreground">All Expenses</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <Button variant="ghost" size="icon" onClick={load} className="h-8 w-8">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">No expenses yet</h3>
            <p className="text-sm text-muted-foreground">Start tracking your spending by adding your first expense.</p>
            <Button className="gap-2 mt-2" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-semibold">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{expense.title}</p>
                      {expense.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{expense.description}</p>}
                      {expense.isRecurring && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          ↻ {expense.recurringPeriod}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${CATEGORY_COLORS[expense.category] ?? "#64748b"}20`, color: CATEGORY_COLORS[expense.category] ?? "#64748b" }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground">
                      {formatAmount(expense.amount, expense.currency)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => deleteExpense(expense.id)}
                        disabled={deleting === expense.id}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        {deleting === expense.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
