import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!await getSuperAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search = searchParams.get("search") ?? "";
  const activeFilter = searchParams.get("active");
  const superAdminFilter = searchParams.get("superAdmin");
  const limit = 20;

  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(activeFilter !== null ? { isActive: activeFilter === "true" } : {}),
    ...(superAdminFilter !== null ? { isSuperAdmin: superAdminFilter === "true" } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, image: true,
        isActive: true, isSuperAdmin: true, emailVerified: true, createdAt: true,
        tenant: { select: { id: true, siteName: true, siteSlug: true, plan: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}
