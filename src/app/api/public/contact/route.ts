import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const contactSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { tenantId, name, email, subject, message } = parsed.data;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, isActive: true }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.contact.create({ data: { tenantId, name, email, subject: subject ?? null, message } });

  return NextResponse.json({ message: "Message sent." }, { status: 201 });
}
