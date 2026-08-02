import { TenantRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Permission definitions
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Content
  "projects:read": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.COLLABORATOR, TenantRole.VIEWER],
  "projects:write": [TenantRole.OWNER, TenantRole.ADMIN],
  "projects:delete": [TenantRole.OWNER, TenantRole.ADMIN],
  "projects:publish": [TenantRole.OWNER, TenantRole.ADMIN],

  "open-source:read": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.COLLABORATOR, TenantRole.VIEWER],
  "open-source:write": [TenantRole.OWNER, TenantRole.ADMIN],
  "open-source:delete": [TenantRole.OWNER, TenantRole.ADMIN],

  "blog:read": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.COLLABORATOR, TenantRole.VIEWER],
  "blog:write": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.COLLABORATOR],
  "blog:publish": [TenantRole.OWNER, TenantRole.ADMIN],
  "blog:delete": [TenantRole.OWNER, TenantRole.ADMIN],

  "services:read": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.VIEWER],
  "services:write": [TenantRole.OWNER, TenantRole.ADMIN],
  "services:delete": [TenantRole.OWNER, TenantRole.ADMIN],

  "reviews:read": [TenantRole.OWNER, TenantRole.ADMIN],
  "reviews:moderate": [TenantRole.OWNER, TenantRole.ADMIN],

  "enquiries:read": [TenantRole.OWNER, TenantRole.ADMIN],
  "enquiries:update": [TenantRole.OWNER, TenantRole.ADMIN],

  "contacts:read": [TenantRole.OWNER, TenantRole.ADMIN],

  "contributors:read": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.COLLABORATOR],
  "contributors:write": [TenantRole.OWNER, TenantRole.ADMIN],

  "tasks:read": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.COLLABORATOR],
  "tasks:write": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.COLLABORATOR],

  // Profile & Settings
  "profile:read": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.VIEWER],
  "profile:write": [TenantRole.OWNER, TenantRole.ADMIN],

  "settings:read": [TenantRole.OWNER, TenantRole.ADMIN],
  "settings:write": [TenantRole.OWNER, TenantRole.ADMIN],

  "admins:read": [TenantRole.OWNER, TenantRole.ADMIN],
  "admins:write": [TenantRole.OWNER], // Only owner can add/remove admins

  // Billing
  "billing:read": [TenantRole.OWNER],
  "billing:write": [TenantRole.OWNER],

  // AI
  "ai:use": [TenantRole.OWNER, TenantRole.ADMIN, TenantRole.COLLABORATOR],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ─────────────────────────────────────────────────────────────────────────────
// Permission checker
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a tenant role has a specific permission.
 * Super admins bypass all tenant-level permission checks.
 */
export function hasPermission(
  role: TenantRole | null | undefined,
  permission: Permission,
  isSuperAdmin = false
): boolean {
  if (isSuperAdmin) return true;
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly TenantRole[]).includes(role);
}

/**
 * Throws an error if the role does not have the required permission.
 * Use in API routes for declarative permission checking.
 */
export function requirePermission(
  role: TenantRole | null | undefined,
  permission: Permission,
  isSuperAdmin = false
): void {
  if (!hasPermission(role, permission, isSuperAdmin)) {
    throw new PermissionError(
      `Insufficient permissions: '${permission}' requires ${PERMISSIONS[permission].join(" or ")}`
    );
  }
}

export class PermissionError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Credit helpers
// ─────────────────────────────────────────────────────────────────────────────

import { PlanType } from "@prisma/client";

export const AI_CREDIT_LIMITS: Record<PlanType, number> = {
  FREE: 10,
  STARTER: 50,
  PRO: 500,
  ENTERPRISE: -1, // -1 = unlimited
};

export function getAiCreditLimit(plan: PlanType): number {
  return AI_CREDIT_LIMITS[plan];
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}
