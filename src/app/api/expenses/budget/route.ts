import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const budgetSchema = z.object({
  monthlyBudget: z.number().positive(),
  currency: z.string().default("INR"),
  categoryBudgets: z.record(z.string(), z.number().positive()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budget = await prisma.budget.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ budget });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = budgetSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { monthlyBudget, currency, categoryBudgets } = parsed.data;
  // Prisma requires Json fields to be cast explicitly
  const catBudgets: Prisma.InputJsonValue | undefined = categoryBudgets
    ? (categoryBudgets as unknown as Prisma.InputJsonValue)
    : undefined;

  const budget = await prisma.budget.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, monthlyBudget, currency, categoryBudgets: catBudgets },
    update: { monthlyBudget, currency, ...(catBudgets !== undefined ? { categoryBudgets: catBudgets } : {}) },
  });
  return NextResponse.json(budget);
}
