import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!await getSuperAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const limit = 20;

  const where = {
    ...(status ? { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" } : {}),
    ...(priority ? { priority: priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" } : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.supportRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.supportRequest.count({ where }),
  ]);

  return NextResponse.json({ tickets, total, page, pages: Math.ceil(total / limit) });
}
