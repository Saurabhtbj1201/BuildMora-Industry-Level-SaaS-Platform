import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "buildmora.com";

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

  // ─── 2. Tenant subdomain / custom domain routing ──────────────────────────
  const isMarketingDomain =
    host === APP_DOMAIN ||
    host === `www.${APP_DOMAIN}` ||
    host === "localhost:3000" ||
    host.startsWith("localhost:");

  if (!isMarketingDomain) {
    const tenant = await resolveTenant(host);

    if (!tenant) {
      return NextResponse.redirect(new URL("/404", `https://${APP_DOMAIN}`));
    }

    const response = NextResponse.next();
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
