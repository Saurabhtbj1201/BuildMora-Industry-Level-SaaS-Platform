import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            emailVerified: true,
            isActive: true,
            isSuperAdmin: true,
            mfaEnabled: true,
            mfaMethod: true,
          },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) throw new Error("Account disabled");
        if (!user.emailVerified) throw new Error("Email not verified");

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isSuperAdmin: user.isSuperAdmin,
          mfaEnabled: user.mfaEnabled,
          mfaMethod: user.mfaMethod,
          mfaPending: user.mfaEnabled, // flag for MFA challenge step
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign in — enrich token with custom fields
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin ?? false;
        token.mfaEnabled = (user as { mfaEnabled?: boolean }).mfaEnabled ?? false;
        token.mfaMethod = (user as { mfaMethod?: string }).mfaMethod;
        token.mfaPending = (user as { mfaPending?: boolean }).mfaPending ?? false;
      }

      // On update trigger (e.g. after MFA verified)
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isSuperAdmin: true, isActive: true, mfaEnabled: true, mfaMethod: true },
        });
        if (dbUser) {
          token.isSuperAdmin = dbUser.isSuperAdmin;
          token.mfaEnabled = dbUser.mfaEnabled;
          token.mfaMethod = dbUser.mfaMethod;
          token.mfaPending = false; // MFA verified
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isSuperAdmin = token.isSuperAdmin as boolean;
      session.user.mfaEnabled = token.mfaEnabled as boolean;
      session.user.mfaMethod = token.mfaMethod as string;
      session.user.mfaPending = token.mfaPending as boolean;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
  },

  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.email) {
        // Provision tenant for new users
        await provisionNewTenant(user.id!, user.email, user.name ?? undefined);
      }

      // Audit log
      if (user.id) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "user.signIn",
            entity: "User",
            entityId: user.id,
          },
        });
      }
    },
  },
});

// ─── Tenant provisioning on first sign-in ────────────────────────────────────
async function provisionNewTenant(
  userId: string,
  email: string,
  name?: string
) {
  // Generate a unique slug from email prefix
  const base = email
    .split("@")[0]!
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);

  let slug = base;
  let attempts = 0;

  // Ensure slug uniqueness
  while (await prisma.tenant.findUnique({ where: { siteSlug: slug } })) {
    slug = `${base}-${Math.floor(Math.random() * 9000) + 1000}`;
    if (++attempts > 10) throw new Error("Could not generate unique slug");
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  const tenant = await prisma.tenant.create({
    data: {
      ownerId: userId,
      siteName: name ? `${name}'s Portfolio` : "My Portfolio",
      siteSlug: slug,
      plan: "FREE",
      isActive: true,
      profile: {
        create: {
          displayName: name ?? "New User",
        },
      },
      aiCreditLedgers: {
        create: {
          month: currentMonth,
          used: 0,
          limit: 10, // FREE plan
        },
      },
    },
  });

  // Add OWNER role
  await prisma.tenantUserRole.create({
    data: {
      userId,
      tenantId: tenant.id,
      role: "OWNER",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      tenantId: tenant.id,
      action: "tenant.created",
      entity: "Tenant",
      entityId: tenant.id,
    },
  });

  return tenant;
}
