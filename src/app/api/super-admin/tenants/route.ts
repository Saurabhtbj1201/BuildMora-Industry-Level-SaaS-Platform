import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!await getSuperAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const plan = searchParams.get("plan");
  const active = searchParams.get("active");
  const search = searchParams.get("search") ?? "";
  const limit = 20;

  const where = {
    ...(plan ? { plan: plan as "FREE" | "STARTER" | "PRO" | "ENTERPRISE" } : {}),
    ...(active !== null ? { isActive: active === "true" } : {}),
    ...(search ? {
      OR: [
        { siteName: { contains: search, mode: "insensitive" as const } },
        { siteSlug: { contains: search, mode: "insensitive" as const } },
        { owner: { email: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {}),
  };

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, siteName: true, siteSlug: true, plan: true,
        isActive: true, customDomain: true, createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { projects: true, blogPosts: true, services: true } },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  return NextResponse.json({ tenants, total, page, pages: Math.ceil(total / limit) });
}
