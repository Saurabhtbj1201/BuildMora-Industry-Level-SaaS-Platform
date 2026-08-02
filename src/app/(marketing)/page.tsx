import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, Sparkles, Globe, BarChart3, ShieldCheck,
  FolderGit2, BookOpen, Code2, CreditCard,
  CheckCircle2, Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "BuildMora — Showcase Your Work. Build Your Brand.",
  description:
    "The industry-level platform for students and professionals. Showcase profiles, projects, blogs, and services with AI assistance, analytics, and custom domains.",
};

const FEATURES = [
  {
    icon: FolderGit2,
    title: "Project Showcase",
    description:
      "Present your projects with rich descriptions, tech stacks, live demos, and GitHub links. AI-assisted content creation included.",
    color: "brand",
  },
  {
    icon: Code2,
    title: "Open Source Hub",
    description:
      "Manage OSS projects with installation guides, contribution workflows, roadmaps, and contributor task boards.",
    color: "success",
  },
  {
    icon: BookOpen,
    title: "Blog & Writing",
    description:
      "Publish technical blogs with a powerful rich-text editor, SEO controls, and AI-powered writing assistance.",
    color: "warning",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track views, enquiries, and performance with beautiful charts. Connect your GA4 account for deeper insights.",
    color: "brand",
  },
  {
    icon: CreditCard,
    title: "Expense Tracker",
    description:
      "Monitor personal budgets, subscriptions, and recurring bills with visual trends and cash flow analysis.",
    color: "success",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description:
      "Connect your own domain. Every portfolio gets a free subdomain at {you}.buildmora.com on all plans.",
    color: "warning",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description:
      "Generate project descriptions, blog content, SEO metadata, and service copy with Google Gemini AI.",
    color: "brand",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description:
      "RBAC, MFA (TOTP + Email OTP), OWASP-compliant APIs, and tenant data isolation out of the box.",
    color: "neutral",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    highlight: false,
    features: [
      "3 Projects",
      "5 Blog Posts",
      "1 Open Source Project",
      "10 AI assists/month",
      "{you}.buildmora.com subdomain",
      "Basic analytics",
      "Expense tracker",
    ],
    cta: "Get Started Free",
    href: "/register",
  },
  {
    name: "Starter",
    price: "₹299",
    period: "per month",
    highlight: false,
    features: [
      "10 Projects",
      "25 Blog Posts",
      "5 Open Source Projects",
      "50 AI assists/month",
      "Custom domain",
      "Advanced analytics",
      "Priority email support",
    ],
    cta: "Start Starter",
    href: "/register?plan=starter",
  },
  {
    name: "Pro",
    price: "₹799",
    period: "per month",
    highlight: true,
    features: [
      "Unlimited Projects",
      "Unlimited Blog Posts",
      "Unlimited Open Source",
      "500 AI assists/month",
      "Custom domain",
      "Full analytics + API",
      "10 GB storage",
      "Priority support",
    ],
    cta: "Go Pro",
    href: "/register?plan=pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    highlight: false,
    features: [
      "Everything in Pro",
      "Unlimited AI assists",
      "100 GB storage",
      "Custom branding",
      "SLA guarantee",
      "Dedicated support",
      "White-label option",
    ],
    cta: "Contact Sales",
    href: "/support",
  },
];

const colorMap: Record<string, string> = {
  brand:   "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-muted text-muted-foreground",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navigation ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container-page h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <span className="text-gradient-brand">BuildMora</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-lg font-medium"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 bg-radial-glow text-center relative overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative container-page max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-medium mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Portfolio Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display tracking-tight text-foreground mb-6 animate-fade-in">
            Showcase Your Work.{" "}
            <span className="text-gradient-brand">Build Your Brand.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            The industry-level platform for students &amp; professionals to publish
            profiles, projects, blogs, and services — with AI assistance, powerful
            analytics, and custom domains.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link
              href="/register"
              className="group flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-glow-brand hover:shadow-none hover:scale-[0.98]"
            >
              Start for Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/docs"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-6 py-3 rounded-xl border border-border hover:border-foreground/20 transition-all duration-200 font-medium"
            >
              View Docs
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {["A", "B", "C", "D"].map((l) => (
                <div
                  key={l}
                  className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-[10px] font-bold border-2 border-background"
                >
                  {l}
                </div>
              ))}
            </div>
            <span>Join <strong className="text-foreground">1,000+</strong> developers showcasing their work</span>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" id="features">
        <div className="container-page">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-4">
              Everything You Need to Stand Out
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              One platform. Every tool to build, publish, and grow your
              professional presence online.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-card border border-border rounded-xl p-5 card-lift group"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${colorMap[feature.color]}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 font-display">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-surface" id="pricing">
        <div className="container-page">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-card border rounded-xl p-6 flex flex-col relative card-lift ${
                  plan.highlight
                    ? "border-primary shadow-glow-brand ring-1 ring-primary/20"
                    : "border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="font-bold font-display text-foreground mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground font-display">
                      {plan.price}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-muted/70 border border-border"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="container-page text-center max-w-2xl">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-5 h-5 fill-warning text-warning" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-4">
            Ready to Build Your Brand?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of developers and students already showcasing their
            work on BuildMora.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-glow-brand hover:shadow-none"
          >
            Create Your Free Portfolio
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-4">
        <div className="container-page flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-foreground">
            <div className="w-6 h-6 rounded bg-gradient-brand flex items-center justify-center text-white text-[10px] font-bold">
              B
            </div>
            BuildMora
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-5">
            {[
              { label: "Features", href: "/features" },
              { label: "Pricing", href: "/pricing" },
              { label: "Docs", href: "/docs" },
              { label: "Blog", href: "/blog" },
              { label: "Support", href: "/support" },
              { label: "Privacy", href: "/privacy-policy" },
              { label: "Terms", href: "/terms-of-service" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <p>© {new Date().getFullYear()} BuildMora. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
