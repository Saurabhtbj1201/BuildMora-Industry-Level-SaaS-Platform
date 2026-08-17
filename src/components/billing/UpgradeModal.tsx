"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { PlanType } from "@prisma/client";

// Razorpay is loaded via script tag — declare the global type
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface UpgradeModalProps {
  plan: PlanType;
  planLabel: string;
  userEmail?: string;
  userName?: string;
  onClose: () => void;
}

export function UpgradeModal({
  plan,
  planLabel,
  userEmail,
  userName,
  onClose,
}: UpgradeModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "loading" | "checkout" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (typeof window.Razorpay !== "undefined") return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleUpgrade = useCallback(async () => {
    setStep("loading");
    setErrorMsg("");

    // 1. Create Razorpay subscription
    const subRes = await fetch("/api/billing/subscribe", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ plan }),
    });

    if (!subRes.ok) {
      const err = await subRes.json();
      setErrorMsg(err.error ?? "Failed to create subscription");
      setStep("error");
      return;
    }

    const { subscriptionId, keyId } = await subRes.json() as {
      subscriptionId: string;
      keyId: string;
    };

    // 2. Load Razorpay checkout.js
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMsg("Failed to load Razorpay. Please refresh and try again.");
      setStep("error");
      return;
    }

    setStep("checkout");

    // 3. Open Razorpay modal
    const rzp = new window.Razorpay({
      key:             keyId,
      subscription_id: subscriptionId,
      name:            "BuildMora",
      description:     `Upgrade to ${planLabel} plan`,
      prefill: {
        name:  userName,
        email: userEmail,
      },
      theme: { color: "#6366f1" },
      handler: async (response: RazorpayResponse) => {
        // 4. Verify payment with our backend
        const verifyRes = await fetch("/api/billing/verify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ ...response, plan }),
        });

        if (verifyRes.ok) {
          setStep("success");
          setTimeout(() => {
            router.refresh();
            onClose();
          }, 2000);
        } else {
          const err = await verifyRes.json();
          setErrorMsg(err.error ?? "Payment verification failed");
          setStep("error");
        }
      },
      modal: {
        ondismiss: () => {
          setStep("idle");
        },
      },
    });

    rzp.open();
  }, [plan, planLabel, userEmail, userName, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-2xl p-6 shadow-2xl">

        {step === "success" ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">You&apos;re all set!</h3>
            <p className="text-sm text-muted-foreground">
              Successfully upgraded to <strong>{planLabel}</strong>. Redirecting…
            </p>
          </div>
        ) : step === "error" ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Payment Failed</h3>
            <p className="text-sm text-muted-foreground mb-4">{errorMsg}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("idle")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h3 className="text-lg font-bold text-foreground font-display mb-1">
                Upgrade to {planLabel}
              </h3>
              <p className="text-sm text-muted-foreground">
                You&apos;ll be redirected to the secure Razorpay checkout to complete your subscription.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={step === "loading" || step === "checkout"}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={step === "loading" || step === "checkout"}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(step === "loading" || step === "checkout") && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {step === "loading" ? "Preparing…" : step === "checkout" ? "Opening…" : "Continue"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
