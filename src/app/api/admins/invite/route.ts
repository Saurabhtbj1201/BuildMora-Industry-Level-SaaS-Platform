import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  tenantId: z.string(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "COLLABORATOR", "VIEWER"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { tenantId, email, role } = parsed.data;

  // Verify caller owns this tenant
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, ownerId: session.user.id } });
  if (!tenant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Find invited user
  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (!invitedUser) return NextResponse.json({ error: "No account found with that email address." }, { status: 404 });

  if (invitedUser.id === session.user.id) {
    return NextResponse.json({ error: "You are already the owner." }, { status: 400 });
  }

  // Upsert role
  await prisma.tenantUserRole.upsert({
    where: { userId_tenantId: { userId: invitedUser.id, tenantId } },
    create: { userId: invitedUser.id, tenantId, role },
    update: { role },
  });

  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, ownerId: session.user.id } });
  if (!tenant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.tenantUserRole.findMany({
    where: { tenantId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members.map((m) => ({
    id: m.id, role: m.role, createdAt: m.createdAt.toISOString(), user: m.user,
  })));
}
