import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const enquirySchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  source: z.enum(["PROJECT", "OPEN_SOURCE", "BLOG", "SERVICE", "COLLABORATION"]),
  entityId: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { tenantId, name, email, phone, message, source, entityId } = parsed.data;

  // Verify tenant exists and is active
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, isActive: true }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build entity references
  const entityRef: {
    projectId?: string; osProjectId?: string; blogId?: string; serviceId?: string;
  } = {};
  if (entityId) {
    if (source === "PROJECT")      entityRef.projectId = entityId;
    if (source === "OPEN_SOURCE")  entityRef.osProjectId = entityId;
    if (source === "BLOG")         entityRef.blogId = entityId;
    if (source === "SERVICE")      entityRef.serviceId = entityId;
  }

  await prisma.enquiry.create({
    data: {
      tenantId,
      name,
      email,
      phone: phone ?? null,
      message,
      source,
      ...entityRef,
    },
  });

  return NextResponse.json({ message: "Enquiry submitted." }, { status: 201 });
}
