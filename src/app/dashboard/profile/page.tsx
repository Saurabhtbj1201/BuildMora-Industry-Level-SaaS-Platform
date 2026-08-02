import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export const metadata = {
  title: "Profile",
};

export const revalidate = 0;

export default async function ProfileDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!tenant) redirect("/onboarding");

  const profile = await prisma.profile.findUnique({
    where: { tenantId: tenant.id },
  });

  const skills = Array.isArray(profile?.skills) ? (profile.skills as string[]) : [];

  return (
    <div className="p-6">
      <ProfileForm
        initialProfile={{
          fullName: profile?.displayName || undefined,
          headline: profile?.headline || undefined,
          bio: profile?.bio || undefined,
          avatarUrl: profile?.avatar || undefined,
          location: profile?.location || undefined,
          websiteUrl: profile?.website || undefined,
          githubUrl: profile?.github || undefined,
          linkedinUrl: profile?.linkedin || undefined,
          twitterUrl: profile?.twitter || undefined,
          skills,
          experience: (profile?.experience as any) || [],
          education: (profile?.education as any) || [],
        }}
      />
    </div>
  );
}
