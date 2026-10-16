import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const supportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const parsed = supportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { name, email, subject, message, priority } = parsed.data;

    // Associate with user and tenant if logged in
    let tenantId: string | null = null;
    let userId: string | null = session?.user?.id ?? null;

    if (userId) {
      const userTenant = await prisma.tenant.findUnique({
        where: { ownerId: userId },
        select: { id: true },
      });
      tenantId = userTenant?.id ?? null;
    }

    const ticket = await prisma.supportRequest.create({
      data: {
        userId,
        tenantId,
        name,
        email,
        subject,
        message,
        priority,
        status: "OPEN",
      },
    });

    // Send notifications to Admin and confirmation to User
    const { sendSupportCreatedNotification } = await import("@/lib/email-service");
    sendSupportCreatedNotification({
      ticketId: ticket.id,
      name,
      email,
      subject,
      message,
      priority,
    }).catch((err) => console.error("[Email] Support ticket creation error:", err));

    return NextResponse.json({ success: true, ticketId: ticket.id }, { status: 201 });
  } catch (err) {
    console.error("[Support API error]:", err);
    return NextResponse.json({ error: "Failed to submit support request" }, { status: 500 });
  }
}
