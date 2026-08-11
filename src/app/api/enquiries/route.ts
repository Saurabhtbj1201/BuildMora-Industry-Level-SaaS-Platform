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
  const source = searchParams.get("source") ?? undefined;

  const enquiries = await prisma.enquiry.findMany({
    where: {
      tenantId: tenant.id,
      ...(status ? { status: status as "NEW" | "READ" | "REPLIED" | "RESOLVED" | "ARCHIVED" } : {}),
      ...(source ? { source: source as "PROJECT" | "OPEN_SOURCE" | "BLOG" | "SERVICE" | "COLLABORATION" } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, message: true, phone: true,
      source: true, status: true, createdAt: true,
      project: { select: { title: true } },
      osProject: { select: { title: true } },
      service: { select: { title: true } },
    },
  });

  return NextResponse.json({ enquiries });
}
