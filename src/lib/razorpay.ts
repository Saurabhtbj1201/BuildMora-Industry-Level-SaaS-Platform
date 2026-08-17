import Razorpay from "razorpay";

// ─── Razorpay singleton ───────────────────────────────────────────────────────
const globalForRazorpay = globalThis as unknown as {
  razorpay: Razorpay | undefined;
};

export const razorpay =
  globalForRazorpay.razorpay ??
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRazorpay.razorpay = razorpay;
}

// ─── Plan IDs (set via Razorpay dashboard → Subscriptions → Plans) ───────────
// Create plans in test mode at https://dashboard.razorpay.com/app/subscriptions/plans
// then paste the plan_XXXXXX IDs into .env
export const RAZORPAY_PLAN_IDS: Record<string, string> = {
  STARTER:    process.env.RAZORPAY_PLAN_STARTER    ?? "",
  PRO:        process.env.RAZORPAY_PLAN_PRO         ?? "",
  ENTERPRISE: process.env.RAZORPAY_PLAN_ENTERPRISE  ?? "",
};

// ─── Pricing display config (INR, monthly) ────────────────────────────────────
export const PLAN_PRICING = {
  FREE:       { price: 0,     label: "Free",       currency: "INR" },
  STARTER:    { price: 999,   label: "₹999/mo",    currency: "INR" },
  PRO:        { price: 2999,  label: "₹2,999/mo",  currency: "INR" },
  ENTERPRISE: { price: 9999,  label: "₹9,999/mo",  currency: "INR" },
} as const;
