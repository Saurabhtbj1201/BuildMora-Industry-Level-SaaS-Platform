import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  Globe, Mail, ExternalLink,
} from "lucide-react";
import {
  GithubIcon, LinkedinIcon, TwitterIcon, InstagramIcon, YoutubeIcon,
} from "@/components/icons/social";
import type { ReactNode } from "react";

interface Props { children: ReactNode }

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  return {
    title: {
      default: tenant.siteName,
      template: `%s — ${tenant.siteName}`,
    },
    description: tenant.seoDescription ?? tenant.tagline ?? `${tenant.siteName} — Powered by BuildMora`,
    openGraph: {
      siteName: tenant.siteName,
      images: tenant.ogImage ? [tenant.ogImage] : [],
    },
  };
}

export default async function PublicLayout({ children }: Props) {
  const tenant = await getTenantFromRequest();

  const profile = tenant.profile as {
    displayName?: string; github?: string; linkedin?: string; twitter?: string;
    instagram?: string; youtube?: string; website?: string; email?: string;
  } | null;

  const nav = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Open Source", href: "/open-source" },
    { label: "Blog", href: "/blog" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
  ];

  const socialLinks = [
    { Icon: GithubIcon, href: profile?.github, label: "GitHub" },
    { Icon: LinkedinIcon, href: profile?.linkedin, label: "LinkedIn" },
    { Icon: TwitterIcon, href: profile?.twitter, label: "Twitter" },
    { Icon: InstagramIcon, href: profile?.instagram, label: "Instagram" },
    { Icon: YoutubeIcon, href: profile?.youtube, label: "YouTube" },
    { Icon: Globe, href: profile?.website, label: "Website" },
  ].filter((s) => s.href);

  return (
    <>
      {/* ── Navigation ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            {tenant.logo ? (
              <img src={tenant.logo} alt={tenant.siteName} className="h-7 w-auto" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                {tenant.siteName[0]}
              </div>
            )}
            <span className="font-bold font-display text-foreground group-hover:text-primary transition-colors">
              {tenant.siteName}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Contact CTA */}
          {profile?.email && (
            <Link
              href="/about#contact"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> Contact
            </Link>
          )}
        </nav>
      </header>

      {/* ── Page Content ─────────────────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/20 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <p className="font-bold font-display text-foreground">{tenant.siteName}</p>
              {tenant.tagline && <p className="text-sm text-muted-foreground">{tenant.tagline}</p>}
            </div>

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                  >
                    <s.Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border text-xs text-muted-foreground">
            <p>{tenant.footerText ?? `© ${new Date().getFullYear()} ${tenant.siteName}. All rights reserved.`}</p>
            <a
              href={process.env.NEXT_PUBLIC_APP_URL ?? "https://www.buildmora.tech"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              Powered by BuildMora <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* ── GA4 ─────────────────────────────────────────────────── */}
      {tenant.gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${tenant.gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${tenant.gaMeasurementId}');`}
          </Script>
        </>
      )}
    </>
  );
}
