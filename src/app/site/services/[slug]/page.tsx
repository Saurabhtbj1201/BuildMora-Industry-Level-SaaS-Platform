import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import EnquiryForm from "@/components/public/EnquiryForm";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  const { slug } = await params;
  const svc = await prisma.service.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
    select: { title: true, seoTitle: true, seoDescription: true },
  });
  if (!svc) return {};
  return { title: svc.seoTitle ?? svc.title, description: svc.seoDescription ?? undefined };
}

export default async function PublicServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const tenant = await getTenantFromRequest();
  const { slug } = await params;

  const service = await prisma.service.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug }, isPublished: true },
  });
  if (!service) notFound();

  const customLinks = service.customLinks as { label: string; url: string }[] | null;

  const reviews = await prisma.review.findMany({
    where: { serviceId: service.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: { id: true, reviewerName: true, rating: true, content: true, createdAt: true },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <Link href="/services" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All Services
      </Link>

      <div className="space-y-5">
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground">{service.title}</h1>
        <p className="text-2xl font-semibold text-primary">
          {service.price ? `${service.currency} ${Number(service.price).toLocaleString()}` : "Contact for pricing"}
        </p>

        {customLinks && customLinks.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {customLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-primary/30 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> {link.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {service.description && (
        <div
          className="prose prose-sm sm:prose-base max-w-none text-foreground
            prose-headings:font-display prose-headings:text-foreground
            prose-a:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: service.description }}
        />
      )}

      {reviews.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold font-display text-foreground">Reviews ({reviews.length})</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card border border-border rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground font-display">{review.reviewerName}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((n) => (
                      <span key={n} className={`text-base ${n <= review.rating ? "text-warning" : "text-muted"}`}>★</span>
                    ))}
                  </div>
                </div>
                {review.content && <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="border-t border-border pt-10">
        <h2 className="text-xl font-bold font-display text-foreground mb-6">Enquire about this service</h2>
        <EnquiryForm tenantId={tenant.id} source="SERVICE" entityId={service.id} />
      </div>
    </div>
  );
}
