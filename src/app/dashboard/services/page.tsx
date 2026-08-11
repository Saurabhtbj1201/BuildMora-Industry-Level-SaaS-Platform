import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Briefcase, Plus, Edit2, Eye, Search, DollarSign, Star, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export const metadata = { title: "Services" };
export const revalidate = 0;

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  if (!tenant) redirect("/onboarding");

  const params = await searchParams;
  const query = params.query ?? "";

  const services = await prisma.service.findMany({
    where: {
      tenantId: tenant.id,
      ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, price: true, currency: true,
      isPublished: true, createdAt: true,
      _count: { select: { enquiries: true, reviews: true } },
    },
  });

  const totalEnquiries = services.reduce((a, s) => a + s._count.enquiries, 0);
  const totalReviews = services.reduce((a, s) => a + s._count.reviews, 0);
  const published = services.filter((s) => s.isPublished).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Services
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Offer freelance or consulting services to your visitors.
          </p>
        </div>
        <Link href="/dashboard/services/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Service
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Services", value: services.length, icon: Briefcase, color: "text-primary bg-primary/10" },
          { label: "Published", value: published, icon: Eye, color: "text-success bg-success/10" },
          { label: "Enquiries", value: totalEnquiries, icon: MessageSquare, color: "text-warning bg-warning/10" },
          { label: "Reviews", value: totalReviews, icon: Star, color: "text-accent bg-accent/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold font-display text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex gap-3 items-center bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search services..."
              defaultValue={query}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-semibold">
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Enquiries</th>
                  <th className="text-left py-3 px-4">Reviews</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground font-display">{svc.title}</p>
                      <p className="text-xs text-muted-foreground">{svc.slug}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                        {svc.price ? `${svc.currency} ${Number(svc.price).toLocaleString()}` : "Contact"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${svc.isPublished ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {svc.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />{svc._count.enquiries}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />{svc._count.reviews}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/dashboard/services/${svc.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">No services yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Offer your skills as services — consulting, design, development, or anything else.
            </p>
            <Link href="/dashboard/services/new">
              <Button className="gap-2 mt-2"><Plus className="w-4 h-4" /> Add Service</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
