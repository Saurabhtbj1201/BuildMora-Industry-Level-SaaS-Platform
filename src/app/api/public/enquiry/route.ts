import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = 'force-dynamic';

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
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, isActive: true },
    select: {
      id: true,
      siteName: true,
      siteSlug: true,
      owner: { select: { email: true, name: true } },
    },
  });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build entity references
  let entityTitle: string | null = null;
  const entityRef: {
    projectId?: string; osProjectId?: string; blogId?: string; serviceId?: string;
  } = {};
  if (entityId) {
    if (source === "PROJECT") {
      entityRef.projectId = entityId;
      const p = await prisma.project.findUnique({ where: { id: entityId }, select: { title: true } });
      if (p) entityTitle = p.title;
    }
    if (source === "OPEN_SOURCE") {
      entityRef.osProjectId = entityId;
      const os = await prisma.openSourceProject.findUnique({ where: { id: entityId }, select: { title: true } });
      if (os) entityTitle = os.title;
    }
    if (source === "BLOG") {
      entityRef.blogId = entityId;
      const b = await prisma.blogPost.findUnique({ where: { id: entityId }, select: { title: true } });
      if (b) entityTitle = b.title;
    }
    if (source === "SERVICE") {
      entityRef.serviceId = entityId;
      const s = await prisma.service.findUnique({ where: { id: entityId }, select: { title: true } });
      if (s) entityTitle = s.title;
    }
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

  // Dispatch email notifications asynchronously
  const { sendEnquiryNotificationToOwner, sendEnquiryConfirmationToVisitor } = await import("@/lib/email-service");
  Promise.allSettled([
    sendEnquiryNotificationToOwner({
      ownerEmail: tenant.owner.email,
      ownerName: tenant.owner.name,
      siteName: tenant.siteName,
      name,
      email,
      phone,
      source,
      entityTitle,
      message,
    }),
    sendEnquiryConfirmationToVisitor({
      email,
      name,
      siteName: tenant.siteName,
      entityTitle,
    }),
  ]).catch((err) => console.error("[Email] Enquiry email error:", err));

  return NextResponse.json({ message: "Enquiry submitted." }, { status: 201 });
}
