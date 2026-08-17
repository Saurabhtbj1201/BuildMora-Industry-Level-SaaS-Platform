import type { PlanType } from "@prisma/client";

// ─── Per-plan feature limits ──────────────────────────────────────────────────
// -1 = unlimited

export interface PlanLimits {
  projects:     number;
  blogPosts:    number;
  services:     number;
  openSource:   number;
  aiCredits:    number;
  customDomain: boolean;
  analytics:    boolean;
  teamMembers:  number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    projects:     3,
    blogPosts:    5,
    services:     3,
    openSource:   5,
    aiCredits:    10,
    customDomain: false,
    analytics:    false,
    teamMembers:  1,
  },
  STARTER: {
    projects:     10,
    blogPosts:    20,
    services:     10,
    openSource:   20,
    aiCredits:    50,
    customDomain: true,
    analytics:    false,
    teamMembers:  3,
  },
  PRO: {
    projects:     50,
    blogPosts:    100,
    services:     50,
    openSource:   100,
    aiCredits:    500,
    customDomain: true,
    analytics:    true,
    teamMembers:  10,
  },
  ENTERPRISE: {
    projects:     -1,
    blogPosts:    -1,
    services:     -1,
    openSource:   -1,
    aiCredits:    -1,
    customDomain: true,
    analytics:    true,
    teamMembers:  -1,
  },
};

/**
 * Returns true if the tenant is within their plan limit for a given resource.
 * -1 means unlimited.
 */
export function withinLimit(plan: PlanType, resource: keyof PlanLimits, currentCount: number): boolean {
  const limit = PLAN_LIMITS[plan][resource];
  if (typeof limit === "boolean") return limit;
  if (limit === -1) return true;
  return currentCount < limit;
}

/**
 * Features included in each plan (for plan comparison UI).
 */
export const PLAN_FEATURES: Record<PlanType, string[]> = {
  FREE: [
    "3 Projects",
    "5 Blog Posts",
    "3 Services",
    "10 AI Credits/month",
    "BuildMora subdomain",
    "Public portfolio site",
    "Enquiry & contact forms",
  ],
  STARTER: [
    "10 Projects",
    "20 Blog Posts",
    "10 Services",
    "50 AI Credits/month",
    "Custom domain",
    "3 Team members",
    "Everything in Free",
  ],
  PRO: [
    "50 Projects",
    "100 Blog Posts",
    "50 Services",
    "500 AI Credits/month",
    "Custom domain + SSL",
    "Analytics dashboard",
    "10 Team members",
    "Priority support",
    "Everything in Starter",
  ],
  ENTERPRISE: [
    "Unlimited everything",
    "Unlimited AI Credits",
    "Custom domain + CDN",
    "Advanced analytics",
    "Unlimited team members",
    "Dedicated support",
    "SLA guarantee",
    "Everything in Pro",
  ],
};
