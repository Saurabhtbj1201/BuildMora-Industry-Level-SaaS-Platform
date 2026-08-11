import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Metadata } from "next";
import { Star } from "lucide-react";

export const dynamic = 'force-dynamic';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  return { title: "Services", description: `Services offered by ${tenant.siteName}` };
}

export default async function PublicServicesPage() {
  const tenant = await getTenantFromRequest();

  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id, isPublished: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, description: true, price: true, currency: true },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-2">
          <Star className="w-7 h-7 text-primary" /> Services
        </h1>
        <p className="text-muted-foreground">Ways I can help you. Get in touch to discuss your project.</p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No services listed yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc) => (
            <Link key={svc.id} href={`/services/${svc.slug}`}
              className="group bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-md transition-all flex flex-col gap-4">
              <h2 className="font-bold font-display text-foreground group-hover:text-primary transition-colors text-lg">{svc.title}</h2>
              {svc.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1"
                  dangerouslySetInnerHTML={{ __html: svc.description.replace(/<[^>]*>/g, " ").slice(0, 160) }} />
              )}
              <p className="font-semibold text-foreground">
                {svc.price ? `${svc.currency} ${Number(svc.price).toLocaleString()}` : "Contact for pricing"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
