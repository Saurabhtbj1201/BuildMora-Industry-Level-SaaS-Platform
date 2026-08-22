import "server-only";
import Razorpay from "razorpay";

// ─── Razorpay singleton (server-only) ────────────────────────────────────────
const globalForRazorpay = globalThis as unknown as {
  razorpay: Razorpay | undefined;
};

export const razorpay =
  globalForRazorpay.razorpay ??
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID ?? "",
    key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
  });

if (process.env.NODE_ENV !== "production") {
  globalForRazorpay.razorpay = razorpay;
}

// ─── Plan IDs (server-only — set via Razorpay dashboard → Subscriptions → Plans) ──
export const RAZORPAY_PLAN_IDS: Record<string, string> = {
  STARTER:    process.env.RAZORPAY_PLAN_STARTER    ?? "",
  PRO:        process.env.RAZORPAY_PLAN_PRO         ?? "",
  ENTERPRISE: process.env.RAZORPAY_PLAN_ENTERPRISE  ?? "",
};
