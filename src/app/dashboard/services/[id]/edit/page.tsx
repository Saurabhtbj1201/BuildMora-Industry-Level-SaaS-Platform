import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ServiceForm from "@/components/services/ServiceForm";

export const dynamic = 'force-dynamic';

export const metadata = { title: "Edit Service" };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!tenant) redirect("/onboarding");

  const service = await prisma.service.findUnique({ where: { id, tenantId: tenant.id } });
  if (!service) notFound();

  return (
    <ServiceForm
      mode="edit"
      initial={{
        id: service.id,
        title: service.title,
        slug: service.slug,
        description: service.description ?? "",
        price: service.price ? String(service.price) : "",
        currency: service.currency,
        isPublished: service.isPublished,
        customLinks: (service.customLinks as { label: string; url: string }[]) ?? [],
        seoTitle: service.seoTitle ?? "",
        seoDescription: service.seoDescription ?? "",
        metaKeywords: service.metaKeywords ?? "",
      }}
    />
  );
}
