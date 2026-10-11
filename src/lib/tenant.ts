import { prisma } from "@/lib/db";

// ─── In-memory LRU cache for tenant slug → id resolution ─────────────────────
// Max 500 entries, 5-minute TTL — prevents DB hit on every request
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 500;

interface CacheEntry {
  tenantId: string;
  cachedAt: number;
}

const slugCache = new Map<string, CacheEntry>();
const domainCache = new Map<string, CacheEntry>();

function pruneCache(cache: Map<string, CacheEntry>) {
  if (cache.size >= CACHE_MAX) {
    // Remove oldest 20% when full
    const cutoff = Date.now() - CACHE_TTL_MS;
    for (const [key, entry] of cache.entries()) {
      if (entry.cachedAt < cutoff) cache.delete(key);
    }
    // If still too large, remove first entries (LRU approximation)
    if (cache.size >= CACHE_MAX) {
      const toDelete = Math.floor(CACHE_MAX * 0.2);
      let count = 0;
      for (const key of cache.keys()) {
        cache.delete(key);
        if (++count >= toDelete) break;
      }
    }
  }
}

function getCached(cache: Map<string, CacheEntry>, key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.tenantId;
}

function setCache(cache: Map<string, CacheEntry>, key: string, tenantId: string) {
  pruneCache(cache);
  cache.set(key, { tenantId, cachedAt: Date.now() });
}

// ─── Tenant Resolution ────────────────────────────────────────────────────────

export async function resolveTenant(
  host: string
): Promise<{ tenantId: string; slug: string } | null> {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "buildmora.tech";

  // 1. Subdomain routing: {slug}.buildmora.tech
  if (host.endsWith(`.${appDomain}`)) {
    const slug = host.replace(`.${appDomain}`, "").toLowerCase();

    // Skip non-tenant subdomains
    if (["www", "api", "admin", "dashboard"].includes(slug)) return null;

    const cached = getCached(slugCache, slug);
    if (cached) return { tenantId: cached, slug };

    const tenant = await prisma.tenant.findUnique({
      where: { siteSlug: slug, isActive: true },
      select: { id: true, siteSlug: true },
    });

    if (!tenant) return null;
    setCache(slugCache, slug, tenant.id);
    return { tenantId: tenant.id, slug: tenant.siteSlug };
  }

  // 2. Custom domain fallback
  const cached = getCached(domainCache, host);
  if (cached) return { tenantId: cached, slug: host };

  const tenant = await prisma.tenant.findFirst({
    where: { customDomain: host, customDomainVerified: true, isActive: true },
    select: { id: true, siteSlug: true },
  });

  if (!tenant) return null;
  setCache(domainCache, host, tenant.id);
  return { tenantId: tenant.id, slug: tenant.siteSlug };
}

// Exported for use in route handlers
export function invalidateTenantCache(slug?: string, domain?: string) {
  if (slug) slugCache.delete(slug);
  if (domain) domainCache.delete(domain);
}
