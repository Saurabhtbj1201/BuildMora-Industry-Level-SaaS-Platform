"use client";

import { useState, useEffect } from "react";
import {
  Star, CheckCircle2, XCircle, Trash2, Loader2,
  Filter, RefreshCw, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Review {
  id: string;
  reviewerName: string;
  reviewerEmail: string | null;
  rating: number;
  content: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  project: { id: string; title: string } | null;
  service: { id: string; title: string } | null;
}

// ─── Star row ──────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? "fill-warning text-warning" : "text-muted"}`}
        />
      ))}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border border-warning/20",
  APPROVED: "bg-success/10 text-success border border-success/20",
  REJECTED: "bg-destructive/10 text-destructive border border-destructive/20",
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"" | "PENDING" | "APPROVED" | "REJECTED">("");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/reviews${filter ? `?status=${filter}` : ""}`);
    const data = await res.json();
    setReviews(data.reviews ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  async function updateStatus(id: string, status: "APPROVED" | "REJECTED") {
    setUpdating(id);
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    setUpdating(null);
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setUpdating(id);
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setUpdating(null);
  }

  const pending = reviews.filter((r) => r.status === "PENDING").length;
  const approved = reviews.filter((r) => r.status === "APPROVED").length;
  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Moderate reviews from your visitors. Approve to show them publicly.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: reviews.length, color: "text-primary bg-primary/10", icon: Star },
          { label: "Pending", value: pending, color: "text-warning bg-warning/10", icon: MessageSquare },
          { label: "Approved", value: approved, color: "text-success bg-success/10", icon: CheckCircle2 },
          { label: "Avg Rating", value: avgRating, color: "text-accent bg-accent/10", icon: Star },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold font-display text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Filter bar */}
        <div className="p-4 border-b border-border flex gap-3 items-center bg-muted/20">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {(["", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">No reviews yet</h3>
            <p className="text-sm text-muted-foreground">Reviews from your visitors will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reviews.map((review) => (
              <div key={review.id} className="p-5 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Reviewer info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground font-display">
                        {review.reviewerName}
                      </span>
                      {review.reviewerEmail && (
                        <span className="text-xs text-muted-foreground">{review.reviewerEmail}</span>
                      )}
                      <Stars rating={review.rating} />
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[review.status]}`}>
                        {review.status}
                      </span>
                    </div>

                    {/* Context label */}
                    {(review.project || review.service) && (
                      <p className="text-xs text-muted-foreground">
                        On:{" "}
                        <span className="font-medium text-foreground">
                          {review.project?.title ?? review.service?.title}
                        </span>
                      </p>
                    )}

                    {/* Content */}
                    {review.content && (
                      <p className="text-sm text-foreground/80 leading-relaxed mt-1">{review.content}</p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {review.status !== "APPROVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(review.id, "APPROVED")}
                        disabled={updating === review.id}
                        className="h-8 gap-1.5 text-xs text-success border-success/20 hover:bg-success/10"
                      >
                        {updating === review.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Approve
                      </Button>
                    )}
                    {review.status !== "REJECTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(review.id, "REJECTED")}
                        disabled={updating === review.id}
                        className="h-8 gap-1.5 text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                      >
                        {updating === review.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        Reject
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteReview(review.id)}
                      disabled={updating === review.id}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
