import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

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

  const updated = await prisma.supportRequest.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, subject: true, status: true, adminNotes: true },
  });

  // Notify user of status update or admin notes
  if (status !== undefined || adminNotes !== undefined) {
    const { sendSupportResolvedNotification } = await import("@/lib/email-service");
    sendSupportResolvedNotification({
      ticketId: updated.id,
      name: updated.name,
      email: updated.email,
      subject: updated.subject,
      status: updated.status,
      adminNotes: updated.adminNotes,
    }).catch((err) => console.error("[Email] Support update notification error:", err));
  }

  return NextResponse.json({ success: true, ticket: updated });
}
