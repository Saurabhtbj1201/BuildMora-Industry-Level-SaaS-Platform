import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Metadata } from "next";
import {
  MapPin, Globe, Mail, Briefcase, Code2, BookOpen, Star, ArrowRight,
} from "lucide-react";
import {
  GithubIcon, LinkedinIcon, TwitterIcon,
} from "@/components/icons/social";

export const dynamic = 'force-dynamic';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  return {
    title: tenant.siteName,
    description: tenant.seoDescription ?? tenant.tagline ?? `${tenant.siteName}'s profile`,
  };
}

export default async function PublicHomePage() {
  const tenant = await getTenantFromRequest();

  const profile = tenant.profile as {
    displayName?: string; bio?: string; avatar?: string;
    headline?: string; location?: string; website?: string; email?: string;
    github?: string; linkedin?: string; twitter?: string;
    skills?: string[];
    experience?: { company: string; role: string; duration: string; desc?: string }[];
  } | null;

  const [projects, posts, services] = await Promise.all([
    prisma.project.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, category: true, status: true, techStack: true, description: true },
    }),
    prisma.blogPost.findMany({
      where: { tenantId: tenant.id, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, category: true, excerpt: true, publishedAt: true, readingTime: true },
    }),
    prisma.service.findMany({
      where: { tenantId: tenant.id, isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, price: true, currency: true, description: true },
    }),
  ]);

  const skills = profile?.skills as string[] | null;
  const experience = profile?.experience as { company: string; role: string; duration: string; desc?: string }[] | null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-20">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <div className="shrink-0">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.displayName ?? tenant.siteName}
              className="w-28 h-28 rounded-2xl object-cover ring-4 ring-primary/20"
            />
          ) : (
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white ring-4 ring-primary/20">
              {(profile?.displayName ?? tenant.siteName)[0]}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
            {profile?.displayName ?? tenant.siteName}
          </h1>
          {profile?.headline && (
            <p className="text-lg text-primary font-medium">{profile.headline}</p>
          )}
          {(tenant.tagline ?? profile?.bio) && (
            <p className="text-muted-foreground leading-relaxed max-w-xl">
              {tenant.tagline ?? profile?.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
            {profile?.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
            )}
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Globe className="w-3.5 h-3.5" />{new URL(profile.website).hostname}
              </a>
            )}
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                <Mail className="w-3.5 h-3.5" />{profile.email}
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            {profile?.github && (
              <a href={profile.github} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                <GithubIcon className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            {profile?.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
            {profile?.twitter && (
              <a href={profile.twitter} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                <TwitterIcon className="w-3.5 h-3.5" /> Twitter
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Skills ─────────────────────────────────────────────── */}
      {skills && skills.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-display text-foreground">Skills & Technologies</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent Projects ─────────────────────────────────────── */}
      {projects.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Recent Projects
            </h2>
            <Link href="/projects" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.slug}`}
                className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{p.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === "COMPLETED" ? "bg-success/10 text-success" :
                    p.status === "IN_PROGRESS" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>{p.status.replace("_", " ")}</span>
                </div>
                <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors mb-1">{p.title}</h3>
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: p.description.replace(/<[^>]*>/g, " ").slice(0, 100) }} />
                )}
                {p.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {p.techStack.slice(0, 4).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Latest Blog Posts ───────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Latest Articles
            </h2>
            <Link href="/blog" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all gap-2">
                <div className="space-y-0.5">
                  <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                  {post.excerpt && <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  {post.readingTime && <span>{post.readingTime} min read</span>}
                  {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Services CTA ────────────────────────────────────────── */}
      {services.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" /> Services
            </h2>
            <Link href="/services" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <Link key={svc.id} href={`/services/${svc.slug}`}
                className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all">
                <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors mb-2">{svc.title}</h3>
                {svc.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: svc.description.replace(/<[^>]*>/g, " ").slice(0, 100) }} />
                )}
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {svc.price ? `${svc.currency} ${Number(svc.price).toLocaleString()}` : "Contact for pricing"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Experience ──────────────────────────────────────────── */}
      {experience && experience.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" /> Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp, i) => (
              <div key={i} className="flex gap-4">
                <div className="relative mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  {i < experience.length - 1 && <div className="absolute top-3 left-0.5 w-[1px] h-full bg-border" />}
                </div>
                <div className="pb-4">
                  <p className="font-semibold text-foreground font-display">{exp.role}</p>
                  <p className="text-sm text-primary">{exp.company} <span className="text-muted-foreground font-normal">· {exp.duration}</span></p>
                  {exp.desc && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{exp.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
