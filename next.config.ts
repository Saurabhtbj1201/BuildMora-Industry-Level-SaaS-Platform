import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.buildmora.com"],
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Wildcard subdomain support — allow *.buildmora.com
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.amazonaws.com https://*.cloudfront.net https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://www.google-analytics.com https://*.amazonaws.com",
              "frame-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Redirect www → non-www for marketing site
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.buildmora.com" }],
        destination: "https://buildmora.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
