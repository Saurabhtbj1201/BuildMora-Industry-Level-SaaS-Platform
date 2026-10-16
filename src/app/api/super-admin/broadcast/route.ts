import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdmin";
import { prisma } from "@/lib/db";
import { sendBroadcastEmail } from "@/lib/email-service";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const broadcastSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  heading: z.string().min(3, "Heading must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  ctaText: z.string().optional().or(z.literal("")),
  ctaUrl: z.string().url("Valid URL required").optional().or(z.literal("")),
  target: z.enum([
    "ALL",
    "TENANTS",
    "PLAN_FREE",
    "PLAN_STARTER",
    "PLAN_PRO",
    "PLAN_ENTERPRISE",
    "CUSTOM",
    "TEST",
  ]),
  customEmails: z.array(z.string().email()).optional(),
});

// GET: Returns counts and recent broadcasts
export async function GET() {
  const session = await getSuperAdminSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    allUsersCount,
    tenantsCount,
    freePlanCount,
    starterPlanCount,
    proPlanCount,
    enterprisePlanCount,
    recentBroadcasts,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.tenant.count({ where: { isActive: true, plan: "FREE" } }),
    prisma.tenant.count({ where: { isActive: true, plan: "STARTER" } }),
    prisma.tenant.count({ where: { isActive: true, plan: "PRO" } }),
    prisma.tenant.count({ where: { isActive: true, plan: "ENTERPRISE" } }),
    prisma.auditLog.findMany({
      where: { action: "broadcast.sent" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
        user: { select: { email: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    counts: {
      ALL: allUsersCount,
      TENANTS: tenantsCount,
      PLAN_FREE: freePlanCount,
      PLAN_STARTER: starterPlanCount,
      PLAN_PRO: proPlanCount,
      PLAN_ENTERPRISE: enterprisePlanCount,
    },
    recentBroadcasts,
  });
}

// POST: Execute broadcast sending
export async function POST(req: NextRequest) {
  const session = await getSuperAdminSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = broadcastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { subject, heading, message, ctaText, ctaUrl, target, customEmails } = parsed.data;

  // Resolve recipients
  type Recipient = { email: string; name?: string | null };
  let recipients: Recipient[] = [];

  if (target === "TEST") {
    // Send only to the super-admin themselves
    recipients = [{ email: session.user.email!, name: session.user.name }];
  } else if (target === "CUSTOM") {
    if (!customEmails || customEmails.length === 0) {
      return NextResponse.json({ error: "No custom emails provided" }, { status: 400 });
    }
    recipients = Array.from(new Set(customEmails)).map((email) => ({ email }));
  } else if (target === "ALL") {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { email: true, name: true },
    });
    recipients = users;
  } else if (target === "TENANTS") {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { owner: { select: { email: true, name: true } } },
    });
    recipients = tenants.map((t) => t.owner);
  } else if (target.startsWith("PLAN_")) {
    const plan = target.replace("PLAN_", "") as "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true, plan },
      select: { owner: { select: { email: true, name: true } } },
    });
    recipients = tenants.map((t) => t.owner);
  }

  // Deduplicate emails
  const uniqueMap = new Map<string, Recipient>();
  for (const r of recipients) {
    if (r.email && !uniqueMap.has(r.email.toLowerCase())) {
      uniqueMap.set(r.email.toLowerCase(), r);
    }
  }
  const finalRecipients = Array.from(uniqueMap.values());

  if (finalRecipients.length === 0) {
    return NextResponse.json({ error: "No valid recipients found for this target." }, { status: 400 });
  }

  // Process message body (convert newlines to paragraphs/breaks)
  const formattedHtml = message
    .split("\n\n")
    .map((paragraph) => `<p style="margin: 0 0 16px;">${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");

  // Send in batches to respect AWS SES limits
  let totalSent = 0;
  let totalFailed = 0;
  const BATCH_SIZE = 5;

  for (let i = 0; i < finalRecipients.length; i += BATCH_SIZE) {
    const batch = finalRecipients.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((r) =>
        sendBroadcastEmail({
          to: r.email,
          recipientName: r.name,
          subject,
          heading,
          bodyContent: formattedHtml,
          ctaText: ctaText || undefined,
          ctaUrl: ctaUrl || undefined,
        })
      )
    );

    for (const res of results) {
      if (res.status === "fulfilled" && res.value.success) {
        totalSent++;
      } else {
        totalFailed++;
      }
    }

    // Small delay between batches to stay safely within SES sending limits
    if (i + BATCH_SIZE < finalRecipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  // Record audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "broadcast.sent",
      entity: "Broadcast",
      newValue: {
        subject,
        heading,
        target,
        totalRecipients: finalRecipients.length,
        totalSent,
        totalFailed,
        ctaUrl: ctaUrl || null,
      },
    },
  });

  return NextResponse.json({
    success: true,
    totalSent,
    totalFailed,
    totalRecipients: finalRecipients.length,
  });
}
