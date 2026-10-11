import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "buildmora.tech";
// Also treat the Vercel deployment URL as a marketing domain so it doesn't
// try to resolve a tenant when accessed directly via buildmora.vercel.app
const VERCEL_URL = process.env.VERCEL_URL ? `${process.env.VERCEL_URL}` : null;

// Paths requiring super admin
const SUPER_ADMIN_PATHS = ["/super-admin"];

// Paths requiring authentication
const AUTH_REQUIRED_PATHS = ["/dashboard"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const session = await auth();

  // ─── 1. Skip API routes and Next.js internals ─────────────────────────────
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // ─── 2. Redirect apex domain to www.buildmora.tech ───────────────────────
  const cleanHost = host.split(":")[0] ?? "";
  if (cleanHost === "buildmora.tech") {
    const wwwUrl = new URL(req.url);
    wwwUrl.hostname = "www.buildmora.tech";
    wwwUrl.protocol = "https:";
    return NextResponse.redirect(wwwUrl, { status: 308 });
  }

  // ─── 3. Tenant subdomain / custom domain routing ──────────────────────────
  const isMarketingDomain =
    cleanHost === "www.buildmora.tech" ||
    cleanHost === "buildmora.tech" ||
    cleanHost === APP_DOMAIN ||
    cleanHost === `www.${APP_DOMAIN}` ||
    cleanHost === "localhost" ||
    cleanHost.startsWith("localhost") ||
    // Always treat Vercel deployment URL as marketing domain
    (VERCEL_URL !== null && host === VERCEL_URL) ||
    host.endsWith(".vercel.app");

  if (!isMarketingDomain) {
    const tenant = await resolveTenant(host);

    if (!tenant) {
      return NextResponse.redirect(new URL("/404", "https://www.buildmora.tech"));
    }

    // Rewrite to /site prefix so tenant pages don't conflict with marketing pages
    const rewriteUrl = new URL(`/site${pathname === "/" ? "" : pathname}`, req.url);
    rewriteUrl.search = req.nextUrl.search;
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-tenant-id", tenant.tenantId);
    response.headers.set("x-tenant-slug", tenant.slug);
    return response;
  }

  // ─── 3. Super admin guard ─────────────────────────────────────────────────
  if (SUPER_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/super-admin", req.url));
    }
    if (!session.user.isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ─── 4. Dashboard auth guard ──────────────────────────────────────────────
  if (AUTH_REQUIRED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
    }

    if (session.user.mfaPending && !pathname.startsWith("/verify-mfa")) {
      return NextResponse.redirect(new URL("/verify-mfa", req.url));
    }

    return NextResponse.next();
  }

  // ─── 5. Redirect logged-in users away from auth pages ─────────────────────
  if (session?.user && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icons/|images/).*)",
  ],
};
