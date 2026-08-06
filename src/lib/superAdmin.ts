import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Guards a Server Component or API route — throws/redirects if
 * the caller is not a logged-in super admin.
 */
export async function requireSuperAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true, isActive: true },
  });

  if (!user?.isSuperAdmin || !user.isActive) redirect("/login");

  return session;
}

/**
 * API-safe version — returns null instead of redirecting.
 */
export async function getSuperAdminSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true, isActive: true },
  });

  if (!user?.isSuperAdmin || !user.isActive) return null;
  return session;
}
