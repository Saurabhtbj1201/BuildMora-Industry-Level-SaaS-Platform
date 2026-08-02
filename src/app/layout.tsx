import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://buildmora.com"
  ),
  title: {
    default: "BuildMora — Showcase Your Work. Build Your Brand.",
    template: "%s | BuildMora",
  },
  description:
    "BuildMora is an industry-level platform for students and professionals to showcase profiles, projects, blogs, and services with powerful analytics and AI assistance.",
  keywords: [
    "portfolio platform",
    "developer portfolio",
    "student portfolio",
    "professional portfolio",
    "showcase projects",
    "blog platform",
    "buildmora",
  ],
  authors: [{ name: "BuildMora" }],
  creator: "BuildMora",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://buildmora.com",
    siteName: "BuildMora",
    title: "BuildMora — Showcase Your Work. Build Your Brand.",
    description:
      "The industry-level platform for students and professionals to showcase profiles, projects, blogs, and services.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "BuildMora Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildMora — Showcase Your Work. Build Your Brand.",
    description:
      "The industry-level platform for students and professionals to showcase their work.",
    images: ["/og-default.png"],
    creator: "@buildmora",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(inter.variable, outfit.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-screen bg-background antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
