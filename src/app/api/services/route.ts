import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { withinLimit } from "@/lib/planLimits";

export const dynamic = 'force-dynamic';

const serviceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  description: z.string().optional(),
  price: z.number().positive().optional().nullable(),
  currency: z.string().default("INR"),
  isPublished: z.boolean().default(false),
  customLinks: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
  metaKeywords: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, price: true, currency: true,
      isPublished: true, createdAt: true,
      _count: { select: { enquiries: true, reviews: true } },
    },
  });

  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { ownerId: session.user.id }, select: { id: true, plan: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // ── Plan limit check ─────────────────────────────────────────────────────
  const serviceCount = await prisma.service.count({ where: { tenantId: tenant.id } });
  if (!withinLimit(tenant.plan, "services", serviceCount)) {
    return NextResponse.json(
      { error: `Service limit reached for your ${tenant.plan} plan. Upgrade to add more.` },
      { status: 403 }
    );
  }


  const body = await request.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const existing = await prisma.service.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: parsed.data.slug } },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ error: "A service with this slug already exists." }, { status: 409 });

  const { price, ...rest } = parsed.data;
  const service = await prisma.service.create({
    data: {
      ...rest,
      tenantId: tenant.id,
      price: price ?? null,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(service, { status: 201 });
}
