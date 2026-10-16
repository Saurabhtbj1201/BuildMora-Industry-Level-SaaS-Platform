import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  tenantId: z.string().min(1),
  reviewerName: z.string().min(1, "Name is required"),
  reviewerEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  rating: z.coerce.number().min(1).max(5),
  content: z.string().optional(),
  projectId: z.string().optional(),
  serviceId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { tenantId, reviewerName, reviewerEmail, rating, content, projectId, serviceId } = parsed.data;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId, isActive: true },
      select: {
        id: true,
        siteName: true,
        owner: { select: { email: true, name: true } },
      },
    });

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    let itemTitle: string | null = null;
    if (projectId) {
      const p = await prisma.project.findUnique({ where: { id: projectId }, select: { title: true } });
      if (p) itemTitle = p.title;
    } else if (serviceId) {
      const s = await prisma.service.findUnique({ where: { id: serviceId }, select: { title: true } });
      if (s) itemTitle = s.title;
    }

    const review = await prisma.review.create({
      data: {
        tenantId,
        reviewerName,
        reviewerEmail: reviewerEmail || null,
        rating,
        content: content || null,
        projectId: projectId || null,
        serviceId: serviceId || null,
        status: "PENDING",
      },
    });

    // Notify tenant owner
    const { sendReviewNotificationToOwner } = await import("@/lib/email-service");
    sendReviewNotificationToOwner({
      ownerEmail: tenant.owner.email,
      ownerName: tenant.owner.name,
      siteName: tenant.siteName,
      reviewerName,
      rating,
      content,
      itemTitle,
    }).catch((err) => console.error("[Email] Review notification error:", err));

    return NextResponse.json({ message: "Review submitted for moderation.", reviewId: review.id }, { status: 201 });
  } catch (error) {
    console.error("[Review API error]:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
