import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("INR"),
  category: z.string().min(1, "Category is required"),
  date: z.string().datetime(),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      ...(category ? { category } : {}),
      ...(from || to ? {
        date: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const expense = await prisma.expense.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      recurringPeriod: parsed.data.recurringPeriod ?? null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
