import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await getSuperAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { status, priority, adminNotes } = await req.json();

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (priority !== undefined) data.priority = priority;
  if (adminNotes !== undefined) data.adminNotes = adminNotes;
  if (status === "RESOLVED" || status === "CLOSED") data.resolvedAt = new Date();

  await prisma.supportRequest.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}
