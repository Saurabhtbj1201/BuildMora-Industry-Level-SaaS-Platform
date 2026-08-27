import "server-only";
import Razorpay from "razorpay";

// ─── Lazy Razorpay singleton ─────────────────────────────────────────────────
// Do NOT instantiate at module load time — the SDK throws if key_id is empty,
// which causes build failures on Vercel when env vars aren't present at build time.
// Instead, create the instance on first call at runtime.

let _razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (_razorpay) return _razorpay;

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables."
    );
  }

  _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _razorpay;
}

// ─── Plan IDs (from env — set via Razorpay dashboard → Subscriptions → Plans) ─
export const RAZORPAY_PLAN_IDS: Record<string, string | undefined> = {
  STARTER:    process.env.RAZORPAY_PLAN_STARTER,
  PRO:        process.env.RAZORPAY_PLAN_PRO,
  ENTERPRISE: process.env.RAZORPAY_PLAN_ENTERPRISE,
};
