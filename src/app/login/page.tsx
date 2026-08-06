"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Mail, Lock, ArrowRight, Shield,
} from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Error messages map ───────────────────────────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  "Account disabled": "Your account has been disabled. Contact support.",
  "Email not verified": "Please verify your email before signing in.",
  OAuthAccountNotLinked: "This email is linked to a different sign-in method.",
  default: "Something went wrong. Please try again.",
};

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const urlError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError ? (ERROR_MESSAGES[urlError] ?? ERROR_MESSAGES.default ?? null) : null
  );
  const [isPending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);

  // ─── Credentials sign-in ─────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.default ?? "An error occurred");
        return;
      }

      if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  }

  // ─── Google sign-in ───────────────────────────────────────────────────────
  async function handleGoogle() {
    setGooglePending(true);
    await signIn("google", { callbackUrl });
  }

  const isLoading = isPending || googlePending;

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left brand panel (desktop) ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-brand flex-col justify-between p-12 overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orb */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-white text-lg border border-white/30">
            B
          </div>
          <span className="text-white font-display font-bold text-xl">
            BuildMora
          </span>
        </Link>

        {/* Tagline */}
        <div className="relative">
          <blockquote className="text-white/90 text-2xl font-display font-semibold leading-snug mb-6">
            &ldquo;Your portfolio is your brand. Make it unforgettable.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["A", "B", "C"].map((l) => (
                <div
                  key={l}
                  className="w-8 h-8 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-white text-xs font-bold border-2 border-white/20"
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-white/70 text-sm">
              Join <strong className="text-white">1,000+</strong> professionals already building their brand
            </p>
          </div>
        </div>

        {/* Features list */}
        <div className="relative grid grid-cols-2 gap-3">
          {[
            "AI-powered writing",
            "Custom domains",
            "Analytics & insights",
            "TOTP & Email MFA",
            "Open source hub",
            "Expense tracker",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-white/80 text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-white/60 shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {/* Mobile logo */}
        <Link
          href="/"
          className="lg:hidden flex items-center gap-2.5 mb-10 font-display font-bold text-xl"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-sm">
            B
          </div>
          <span className="text-gradient-brand">BuildMora</span>
        </Link>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to your BuildMora account
            </p>
          </div>

          {/* Google SSO */}
          <button
            id="login-google-btn"
            type="button"
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mb-6 group"
          >
            {googlePending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">
                or sign in with email
              </span>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              id="login-error-banner"
              className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive mb-5 animate-fade-in"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-50"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-50"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-brand hover:shadow-none group mt-2"
              suppressHydrationWarning
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* MFA hint */}
          <div className="mt-5 flex items-center gap-2 p-3 bg-muted rounded-xl text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span>
              If MFA is enabled, you&apos;ll be prompted for a TOTP code or email OTP after sign-in.
            </span>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
