import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  const reviews = await prisma.review.findMany({
    where: {
      tenantId: tenant.id,
      ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, reviewerName: true, reviewerEmail: true, rating: true,
      content: true, status: true, createdAt: true,
      project: { select: { id: true, title: true } },
      service: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ reviews });
}
