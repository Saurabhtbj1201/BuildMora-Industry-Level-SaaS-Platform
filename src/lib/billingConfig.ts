/**
 * Client-safe billing constants — no server SDK imports.
 * Use this file in client components instead of lib/razorpay.ts
 */

export const PLAN_PRICING = {
  FREE:       { price: 0,     label: "Free",       currency: "INR" },
  STARTER:    { price: 999,   label: "₹999/mo",    currency: "INR" },
  PRO:        { price: 2999,  label: "₹2,999/mo",  currency: "INR" },
  ENTERPRISE: { price: 9999,  label: "₹9,999/mo",  currency: "INR" },
} as const;
