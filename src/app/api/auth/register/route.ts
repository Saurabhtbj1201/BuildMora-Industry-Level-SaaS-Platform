import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  plan: z.enum(["free", "starter", "pro", "enterprise"]).optional().default("free"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user — emailVerified set immediately (no email verification for now)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: new Date(), // auto-verify; add email verification flow later
        isActive: true,
      },
      select: { id: true, email: true, name: true },
    });

    // Provision tenant (slug from email prefix)
    const base = email
      .split("@")[0]!
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);

    let slug = base;
    let attempts = 0;
    while (await prisma.tenant.findUnique({ where: { siteSlug: slug } })) {
      slug = `${base}-${Math.floor(Math.random() * 9000) + 1000}`;
      if (++attempts > 10) {
        return NextResponse.json(
          { error: "Could not generate a unique site slug. Please try again." },
          { status: 500 }
        );
      }
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    const tenant = await prisma.tenant.create({
      data: {
        ownerId: user.id,
        siteName: `${name}'s Portfolio`,
        siteSlug: slug,
        plan: "FREE",
        isActive: true,
        profile: {
          create: {
            displayName: name,
          },
        },
        aiCreditLedgers: {
          create: {
            month: currentMonth,
            used: 0,
            limit: 10,
          },
        },
      },
    });

    await prisma.tenantUserRole.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: "OWNER",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        action: "user.registered",
        entity: "User",
        entityId: user.id,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully.", userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
