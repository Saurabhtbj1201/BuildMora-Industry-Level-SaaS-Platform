import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, requireAuth, requireTenantAccess, withErrorHandler } from "@/lib/api";

export const dynamic = 'force-dynamic';

// GET /api/profile
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId } = await requireTenantAccess(session.user.id);

  const profile = await prisma.profile.findUnique({
    where: { tenantId },
  });

  return ok(profile);
});

// PUT /api/profile — Update user profile
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const { tenantId } = await requireTenantAccess(session.user.id);
  const body = await req.json();

  const profile = await prisma.profile.upsert({
    where: { tenantId },
    create: {
      tenantId,
      displayName: body.fullName,
      headline: body.headline,
      bio: body.bio,
      avatar: body.avatarUrl,
      location: body.location,
      website: body.websiteUrl,
      github: body.githubUrl,
      linkedin: body.linkedinUrl,
      twitter: body.twitterUrl,
      skills: body.skills ? JSON.parse(JSON.stringify(body.skills)) : undefined,
      experience: body.experience ? JSON.parse(JSON.stringify(body.experience)) : undefined,
      education: body.education ? JSON.parse(JSON.stringify(body.education)) : undefined,
    },
    update: {
      displayName: body.fullName,
      headline: body.headline,
      bio: body.bio,
      avatar: body.avatarUrl,
      location: body.location,
      website: body.websiteUrl,
      github: body.githubUrl,
      linkedin: body.linkedinUrl,
      twitter: body.twitterUrl,
      skills: body.skills ? JSON.parse(JSON.stringify(body.skills)) : undefined,
      experience: body.experience ? JSON.parse(JSON.stringify(body.experience)) : undefined,
      education: body.education ? JSON.parse(JSON.stringify(body.education)) : undefined,
    },
  });

  return ok(profile);
});
