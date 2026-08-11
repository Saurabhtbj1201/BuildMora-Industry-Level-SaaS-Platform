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

  const contacts = await prisma.contact.findMany({
    where: {
      tenantId: tenant.id,
      ...(status ? { status: status as "NEW" | "READ" | "REPLIED" | "RESOLVED" | "ARCHIVED" } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contacts });
}
